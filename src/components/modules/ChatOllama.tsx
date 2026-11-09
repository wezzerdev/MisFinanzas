"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Camera,
  Bot,
  User,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  Building2,
  Tag,
  X,
  CreditCard,
} from "lucide-react";
import { ReceiptOcrResult } from "@/lib/ollama";
import { formatCurrency } from "@/lib/utils";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text?: string;
  image?: string;
  ocrData?: ReceiptOcrResult;
  isConfirmed?: boolean;
  createdAt: Date;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
}

interface ChatOllamaProps {
  onTransactionCreated?: () => void;
}

export const ChatOllama: React.FC<ChatOllamaProps> = ({
  onTransactionCreated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hola, soy tu Asesor IA local. Consulta tus finanzas o adjunta la foto de un recibo para registrarlo con 1-Tap.",
      createdAt: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccountsMap, setSelectedAccountsMap] = useState<
    Record<string, string>
  >({});
  const [insertingId, setInsertingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const accountOptions: CustomSelectOption[] = accounts.map((acc) => ({
    value: acc.id,
    label: acc.name,
    sublabel: formatCurrency(acc.balance),
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [accRes, catRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/categories"),
        ]);
        const accJson = await accRes.json();
        const catJson = await catRes.json();

        if (accJson.success && accJson.data.length > 0) {
          setAccounts(accJson.data);
        }
        if (catJson.success && catJson.data.length > 0) {
          setCategories(catJson.data);
        }
      } catch (e) {
        console.error("Error fetching accounts/categories in chat:", e);
      }
    }
    fetchMetadata();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: "user",
      text: inputText.trim() || undefined,
      image: attachedImage || undefined,
      createdAt: new Date(),
    };

    const currentImage = attachedImage;
    const currentText = inputText;

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setAttachedImage(null);
    setIsProcessing(true);

    try {
      if (currentImage) {
        const ocrResponse = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: currentImage }),
        });

        const ocrResult = await ocrResponse.json();

        if (ocrResult.success && ocrResult.data) {
          const assistantMsgId = `asst-${Date.now()}`;
          const newAssistantMsg: ChatMessage = {
            id: assistantMsgId,
            sender: "assistant",
            text: `Recibo detectado: **${ocrResult.data.comercio_o_emisor}**`,
            ocrData: ocrResult.data,
            createdAt: new Date(),
          };

          if (accounts.length > 0) {
            setSelectedAccountsMap((prev) => ({
              ...prev,
              [assistantMsgId]: accounts[0].id,
            }));
          }

          setMessages((prev) => [...prev, newAssistantMsg]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              sender: "assistant",
              text: `No se pudo leer el recibo: ${
                ocrResult.error || "Formato ilegible"
              }.`,
              createdAt: new Date(),
            },
          ]);
        }
      } else {
        const history = messages
          .filter((m) => m.text)
          .map((m) => ({
            role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
            content: m.text!,
          }));

        history.push({ role: "user", content: currentText });

        const chatResponse = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        const chatResult = await chatResponse.json();

        if (chatResult.success && chatResult.data?.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              sender: "assistant",
              text: chatResult.data.reply,
              createdAt: new Date(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              sender: "assistant",
              text: "Ollama no está disponible en http://localhost:11434.",
              createdAt: new Date(),
            },
          ]);
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: `Error: ${err.message || "Error de conexión"}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmOcrInsert = async (msgId: string, ocr: ReceiptOcrResult) => {
    const accountId = selectedAccountsMap[msgId] || accounts[0]?.id;
    if (!accountId) {
      alert("Selecciona una cuenta primero.");
      return;
    }

    setInsertingId(msgId);

    try {
      let categoryId = categories[0]?.id;
      const matched = categories.find(
        (c) => c.name.toLowerCase() === ocr.categoria_sugerida.toLowerCase()
      );
      if (matched) {
        categoryId = matched.id;
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: ocr.monto,
          type: ocr.tipo,
          date: new Date(ocr.fecha).toISOString(),
          note: `${ocr.comercio_o_emisor} ${
            ocr.conceptos.length > 0 ? `(${ocr.conceptos.join(", ")})` : ""
          }`,
          accountId,
          categoryId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar.");
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isConfirmed: true } : m))
      );

      if (onTransactionCreated) {
        onTransactionCreated();
      }
    } catch (error: any) {
      alert(error.message || "Error al insertar.");
    } finally {
      setInsertingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-13.5rem)] min-h-[420px] sm:h-[650px] bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 shadow-xs rounded-3xl overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-[#009fdb]/10 dark:bg-[#153D64]/50 border border-[#009fdb]/30 flex items-center justify-center text-[#009fdb] shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs ${
                msg.sender === "user"
                  ? "bg-[#009fdb] text-white rounded-tr-xs"
                  : "bg-slate-100 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-xs"
              }`}
            >
              {msg.image && (
                <div className="rounded-xl overflow-hidden border border-black/10 max-h-52 bg-black">
                  <img
                    src={msg.image}
                    alt="Comprobante"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {msg.text && (
                <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.text}</p>
              )}

              {/* OCR Confirmation Card */}
              {msg.ocrData && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2.5 mt-1 text-slate-900 dark:text-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#009fdb] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Datos OCR
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        msg.ocrData.tipo === "INCOME"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                      }`}
                    >
                      {msg.ocrData.tipo === "INCOME" ? "INGRESO" : "GASTO"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Monto:</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(msg.ocrData.monto)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-[#0a0a0a] p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{msg.ocrData.comercio_o_emisor}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{msg.ocrData.fecha}</span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{msg.ocrData.categoria_sugerida}</span>
                    </div>
                  </div>

                  {!msg.isConfirmed && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        Cuenta:
                      </label>
                      <CustomSelect
                        value={selectedAccountsMap[msg.id] || accounts[0]?.id || ""}
                        onChange={(val) =>
                          setSelectedAccountsMap((prev) => ({
                            ...prev,
                            [msg.id]: val,
                          }))
                        }
                        options={accountOptions}
                        placeholder="Seleccionar cuenta..."
                        leftIcon={<CreditCard className="w-4 h-4 text-[#009fdb]" />}
                      />
                    </div>
                  )}

                  {msg.isConfirmed ? (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardado</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={insertingId === msg.id}
                      onClick={() => handleConfirmOcrInsert(msg.id, msg.ocrData!)}
                      className="w-full py-2.5 px-3 bg-[#009fdb] hover:bg-[#0088bd] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 min-h-touch"
                    >
                      {insertingId === msg.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar (1-Tap)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-full bg-[#153D64] text-[#009fdb] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0a0a0a] flex items-center justify-center text-[#009fdb]">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex items-center gap-1.5 p-2.5 rounded-2xl bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-[#009fdb] animate-pulse" />
              <span>Procesando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview if attached */}
      {attachedImage && (
        <div className="p-2.5 bg-slate-100 dark:bg-[#0a0a0a] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#009fdb] bg-black">
              <img
                src={attachedImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Recibo adjunto
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white dark:bg-[#12161f] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#009fdb] flex items-center justify-center transition-colors min-h-touch min-w-touch"
          aria-label="Adjuntar recibo"
        >
          <Camera className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder="Mensaje o consulta..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-[#009fdb] min-h-touch"
        />

        <button
          type="submit"
          disabled={isProcessing || (!inputText.trim() && !attachedImage)}
          className="w-10 h-10 rounded-xl bg-[#009fdb] hover:bg-[#0088bd] text-white flex items-center justify-center shadow-xs disabled:opacity-40 transition-all min-h-touch min-w-touch"
          aria-label="Enviar"
        >
          <Send className="w-4 h-4 stroke-[2.2]" />
        </button>
      </form>
    </div>
  );
};

export default ChatOllama;
