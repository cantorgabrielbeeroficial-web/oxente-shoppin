import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X, Minus, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const FAQ_OPTIONS = [
  {
    id: "order",
    label: "Onde tá meu pedido?",
    response:
      "Oxente, meu caro! Pra ver teu pedido, é só ir na parte de 'Meus Pedidos' no teu perfil. Lá tu encontra todo o rastro da encomenda até chegar na tua porta, visse?",
  },
  {
    id: "cashback",
    label: "Como funciona o cashback?",
    response:
      "É simples demais, meu xodó! Quanto mais tu compra, mais teu chapéu sobe de nível: Bronze (1%), Prata (2-3%) e Ouro (5%). Esse crédito fica guardado pra tu usar na próxima compra e economizar um bocado!",
  },
  {
    id: "sell",
    label: "Como cadastrar minha loja?",
    response:
      "Quer ser nosso parceiro, é? Coisa boa, arretado! Clique no botão 'Vender' no topo da página, preencha teus dados e pronto: tua loja já fica ativa na hora pra todo o Brasil ver a beleza do teu trabalho!",
  },
];

export function MariaBonitaChat() {
  const { user } = useAuthUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const welcomeText = user
      ? `Oxente, cuida, ${user.user_metadata?.["full_name"] || "meu anjo"}! Que alegria arretada te ver por aqui. O que é que tu deseja hoje?`
      : "Oxente, olá! Como posso te ajudar hoje? Sou Maria Bonita, tua assistente aqui no Oxente. Tamo junto nessa?";

    setMessages([
      {
        id: "welcome",
        text: welcomeText,
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  }, [user]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSendMessage = (text: string, sender: "user" | "bot" = "user") => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    if (sender === "user") {
      setInputValue("");
      simulateBotResponse(text);
    }
  };

  const simulateBotResponse = (userText: string) => {
    setIsTyping(true);

    setTimeout(() => {
      let response = "";
      const lowerText = userText.toLowerCase();
      const userName = user?.user_metadata?.["full_name"] || "meu anjo";

      // 1. Check for basic greetings
      const greetings = [
        "oi",
        "olá",
        "ola",
        "tudo bem",
        "bom dia",
        "boa tarde",
        "boa noite",
        "oopa",
        "e aí",
        "e ai",
      ];
      const isGreetingOnly = greetings.some(
        (g) => lowerText === g || lowerText === `${g}?` || lowerText === `${g}!`,
      );
      const containsGreeting = greetings.some((g) => lowerText.includes(g));

      if (isGreetingOnly || (containsGreeting && lowerText.length < 20)) {
        response = `Oxente, olá ! Tudo certinho por aqui, e contigo como é que tá as coisas? Como é que eu posso te ajudar na Oxente hoje? Posso rastrear teus pedidos, ver teu cashback ou tirar qualquer dúvida da loja!`;
      } else if (lowerText.includes("pedido") || lowerText.includes("rastreio")) {
        response = FAQ_OPTIONS.find((f) => f.id === "order")?.response || "";
      } else if (
        lowerText.includes("cashback") ||
        lowerText.includes("moeda") ||
        lowerText.includes("crédito")
      ) {
        response = FAQ_OPTIONS.find((f) => f.id === "cashback")?.response || "";
      } else if (
        lowerText.includes("vender") ||
        lowerText.includes("loja") ||
        lowerText.includes("cadastrar")
      ) {
        response = FAQ_OPTIONS.find((f) => f.id === "sell")?.response || "";
      } else if (
        lowerText.includes("obrigado") ||
        lowerText.includes("valeu") ||
        lowerText.includes("obrigada")
      ) {
        response = `Disponha, ${userName}! Prazer maior é prosear contigo. Precisando de qualquer coisa, é só chamar a Maria Bonita!`;
      } else if (
        lowerText.includes("tchau") ||
        lowerText.includes("até logo") ||
        lowerText.includes("adeus")
      ) {
        response = `Até logo, ${userName}! Volta logo pro nosso cantinho, viu?`;
      }

      if (!response) {
        response =
          "Vixe, não entendi muito bem, mermão. Mas pode perguntar sobre pedidos, cashback ou como vender que eu te ajudo num segundo!";
      }

      const botMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleFaqClick = (option: (typeof FAQ_OPTIONS)[0]) => {
    handleSendMessage(option.label, "user");
  };

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragTransition={{ power: 0, timeConstant: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 50)}
      whileDrag={{ scale: 1.02 }}
      style={{ touchAction: "none" }}
      className="fixed bottom-20 left-4 z-[999] flex flex-col items-start select-none sm:bottom-5 sm:left-5"
    >
      {isOpen ? (
        <Card className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden border-2 border-primary/20 shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between bg-brand-orange-soft px-4 py-3 cursor-move active:cursor-grabbing select-none pointer-events-auto">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src="/logo-oficial.png" alt="Maria Bonita" className="object-cover" />
                <AvatarFallback className="bg-primary text-white">MB</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold text-primary">Maria Bonita</h3>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Assistente Oxente • Online
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 items-center">
              <GripHorizontal className="h-4 w-4 text-primary/40 mr-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea
            ref={scrollRef}
            className="flex-1 p-4 bg-orange-50/30 overflow-y-auto [&>[data-radix-scroll-area-viewport]]:!overflow-y-auto"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex max-w-[80%] flex-col",
                    message.sender === "user" ? "ml-auto items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm shadow-sm",
                      message.sender === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white text-foreground border border-border rounded-tl-none",
                    )}
                  >
                    {message.text}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1 text-primary animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                </div>
              )}

              {messages.length === 1 && !isTyping && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {FAQ_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="sm"
                      className="h-auto border-primary/30 py-1.5 text-[11px] font-medium hover:bg-primary hover:text-white"
                      onClick={() => handleFaqClick(option)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Input */}
          <div className="border-t bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Escreva sua dúvida..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-9 border-primary/20 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" className="h-9 w-9 bg-primary shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      ) : (
        <div
          onClick={() => !isDragging && setIsOpen(true)}
          className="group relative h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary shadow-lg cursor-move active:cursor-grabbing hover:scale-105 transition-transform select-none"
        >
          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white z-20 pointer-events-none"></div>
          <div className="h-full w-full rounded-full flex items-center justify-center relative overflow-hidden pointer-events-none">
            <Avatar className="h-full w-full border-2 border-white/20">
              <AvatarImage src="/logo-oficial.png" alt="Maria Bonita" className="object-cover" />
              <AvatarFallback className="bg-primary text-white">
                <MessageCircle className="h-8 w-8 text-white" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary shadow-md border border-primary/10 group-hover:block whitespace-nowrap pointer-events-none">
            Oxente, cuida!
          </div>
        </div>
      )}
    </motion.div>
  );
}
