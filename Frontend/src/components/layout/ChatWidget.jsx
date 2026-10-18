// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { useLocation } from "react-router-dom";
// import { ArrowLeft, Check, CheckCheck, MessageCircle, Minus, Send, X } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";
// import { useChat } from "../../contexts/ChatContext";

// const API_URL = import.meta.env.VITE_API_URL || "";
// const getHeaders = () => ({
//   Authorization: `Bearer ${localStorage.getItem("authToken")}`,
// });

// const getInitials = (name = "") =>
//   name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

// const ChatWidget = () => {
//   const { user } = useAuth();
//   const { socket, unreadCount, refreshUnread, setActiveContact } = useChat();
//   const location = useLocation();
//   const [open, setOpen] = useState(false);
//   const [contacts, setContacts] = useState([]);
//   const [contactId, setContactId] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [draft, setDraft] = useState("");
//   const [loadingContacts, setLoadingContacts] = useState(false);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState("");
//   const bottomRef = useRef(null);
//   const contact = contacts.find((item) => item.id === contactId);
//   const ownId = String(user?.id || user?._id || "");

//   useEffect(() => {
//     if (!open) {
//       setActiveContact(null);
//       return;
//     }

//     let mounted = true;
//     setLoadingContacts(true);
//     axios.get(`${API_URL}/api/chat/contacts`, { headers: getHeaders() })
//       .then(({ data }) => {
//         if (!mounted) return;
//         const nextContacts = (data.data || []).map((item) => ({
//   ...item,
//   id: String(item.id || item._id),
// }));
//         setContacts(nextContacts);
//         setContactId((current) => {
//           
//             return current;
//           }
//           return nextContacts[0]?.id || "";
//         });
//       })
//       .catch(() => mounted && setError("Could not load chat contacts."))
//       .finally(() => mounted && setLoadingContacts(false));
//     return () => {
//       mounted = false;
//     };
//   }, [open, setActiveContact]);

//   useEffect(() => {
//     if (!open || !contactId) {
//       setActiveContact(null);
//       return undefined;
//     }

//     setActiveContact(contactId);
//     let mounted = true;
//     setLoadingMessages(true);
//     axios.get(`${API_URL}/api/chat/messages/${contactId}`, { headers: getHeaders() })
//       .then(({ data }) => {
//         if (!mounted) return;
//         setMessages(data.data.map((message) => ({
//           ...message,
//           id: String(message._id),
//           senderId: String(message.sender),
//           recipientId: String(message.recipient),
//         })));
//         setContacts((current) => current.map((item) =>
//           String(item.id) === contactId ? { ...item, unreadCount: 0 } : item,
//         ));
//         if (socket?.connected) {
//           socket.emit("chat:read", { contactId }, () => refreshUnread());
//         }
//       })
//       .catch(() => mounted && setError("Could not load this conversation."))
//       .finally(() => mounted && setLoadingMessages(false));

//     return () => {
//       mounted = false;
//     };
//   }, [open, contactId, socket, refreshUnread, setActiveContact]);

//   useEffect(() => {
//     if (!open || !socket) return undefined;
//     const handleMessage = (message) => {
//       const senderId = String(message.senderId);
//       setContacts((current) => current.map((item) => String(item.id) === senderId
//         ? {
//             ...item,
//             lastMessage: { content: message.content, createdAt: message.createdAt },
//             unreadCount: senderId === contactId ? 0 : item.unreadCount + 1,
//           }
//         : item));
//       if (senderId === contactId) {
//         setMessages((current) => current.some((item) => item.id === message.id)
//           ? current
//           : [...current, message]);
//         socket.emit("chat:read", { contactId: senderId }, () => refreshUnread());
//       }
//     };
//     const handleRead = (receipt) => {
//       setMessages((current) => current.map((message) =>
//         message.senderId === ownId && message.recipientId === String(receipt.readerId)
//           ? { ...message, readAt: receipt.readAt }
//           : message,
//       ));
//     };
//     socket.on("chat:message", handleMessage);
//     socket.on("chat:read", handleRead);
//     return () => {
//       socket.off("chat:message", handleMessage);
//       socket.off("chat:read", handleRead);
//     };
//   }, [open, socket, contactId, ownId, refreshUnread]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const sendMessage = (event) => {
//     event.preventDefault();
//     const content = draft.trim();
//     if (!content || !contactId || !socket?.connected || sending) return;
//     setSending(true);
//     socket.emit("chat:send", { recipientId: contactId, content }, (response) => {
//       setSending(false);
//       if (!response?.status) {
//         setError(response?.message || "Message could not be sent.");
//         return;
//       }
//       const message = response.data;
//       setMessages((current) => current.some((item) => item.id === message.id)
//         ? current
//         : [...current, message]);
//       setContacts((current) => current.map((item) => String(item.id) === contactId
//         ? { ...item, lastMessage: { content, createdAt: message.createdAt } }
//         : item));
//       setDraft("");
//     });
//   };

//   if (location.pathname === "/chat") return null;

//   return (
//     <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
//       {open && (
//         <section className="flex h-[min(70dvh,540px)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden border border-border bg-card shadow-2xl" aria-label="Chat support">
//           <header className="flex min-h-16 items-center gap-3 bg-primary px-4 text-primary-foreground">
//             {contact ? (
//               <button
//                 type="button"
//                 onClick={() => { setContactId(""); setError(""); }}
//                 className="rounded p-1 hover:bg-white/15"
//                 aria-label="Back to contacts"
//               >
//                 <ArrowLeft className="h-5 w-5" />
//               </button>
//             ) : (
//               <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
//                 <MessageCircle className="h-5 w-5" />
//               </span>
//             )}
//             <div className="min-w-0 flex-1">
//               <h2 className="truncate text-sm font-semibold">{contact?.name || "Messages"}</h2>
//               <p className="mt-0.5 text-xs text-primary-foreground/75">
//                 {contact ? (contact.role === "hr" ? "Human Resources" : contact.position || "Employee") : "HR and employee support"}
//               </p>
//             </div>
//             <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/15" aria-label="Minimize chat">
//               <Minus className="h-5 w-5" />
//             </button>
//             <button type="button" onClick={() => { setOpen(false); setContactId(""); }} className="rounded p-1 hover:bg-white/15" aria-label="Close chat">
//               <X className="h-5 w-5" />
//             </button>
//           </header>

//           {error && (
//             <div role="alert" className="flex items-center justify-between border-b border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
//               <span>{error}</span>
//               <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
//             </div>
//           )}

//           {!contact ? (
//             <div className="flex-1 overflow-y-auto">
//               <div className="border-b border-border px-4 py-3">
//                 <p className="text-xs text-muted-foreground">Choose someone to start or continue a conversation.</p>
//               </div>
//               {loadingContacts ? (
//                 <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading contacts...</p>
//               ) : contacts.length ? contacts.map((item) => (
//                 <button
//                   type="button"
//                   key={item.id}
//                   onClick={() => { setContactId(String(item.id)); setError(""); }}
//                   className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/60"
//                 >
//                   <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
//                     {item.profileImage
//                       ? <img src={item.profileImage} alt="" className="h-full w-full object-cover" />
//                       : getInitials(item.name)}
//                   </span>
//                   <span className="min-w-0 flex-1">
//                     <span className="block truncate text-sm font-medium text-foreground">{item.name}</span>
//                     <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.lastMessage?.content || item.position || item.email}</span>
//                   </span>
//                   {item.unreadCount > 0 && (
//                     <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white">
//                       {item.unreadCount > 99 ? "99+" : item.unreadCount}
//                     </span>
//                   )}
//                 </button>
//               )) : (
//                 <p className="px-5 py-10 text-center text-sm text-muted-foreground">No chat contacts available.</p>
//               )}
//             </div>
//           ) : (
//             <>
//               <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 px-3 py-4">
//                 <p className="mx-auto mb-3 w-fit border border-border bg-card px-2.5 py-1 text-[10px] text-muted-foreground">Private conversation</p>
//                 {loadingMessages ? (
//                   <p className="py-8 text-center text-xs text-muted-foreground">Loading messages...</p>
//                 ) : messages.length ? messages.map((message) => {
//                   const ownMessage = message.senderId === ownId;
//                   return (
//                     <div key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
//                       <div className={`max-w-[85%] break-words px-3 py-2 ${ownMessage ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}>
//                         <p className="whitespace-pre-wrap text-sm">{message.content}</p>
//                         <span className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${ownMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
//                           {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
//                           {ownMessage && (message.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
//                         </span>
//                       </div>
//                     </div>
//                   );
//                 }) : (
//                   <p className="px-5 py-10 text-center text-sm text-muted-foreground">Say hello to {contact.name}.</p>
//                 )}
//                 <div ref={bottomRef} />
//               </div>
//               <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border bg-card p-3">
//                 <textarea
//                   rows={1}
//                   maxLength={4000}
//                   value={draft}
//                   onChange={(event) => setDraft(event.target.value)}
//                   onKeyDown={(event) => {
//                     if (event.key === "Enter" && !event.shiftKey) {
//                       event.preventDefault();
//                       event.currentTarget.form.requestSubmit();
//                     }
//                   }}
//                   placeholder="Write a message..."
//                   aria-label="Write a message"
//                   className="max-h-24 min-h-10 flex-1 resize-y border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
//                 />
//                 <button
//                   type="submit"
//                   disabled={!draft.trim() || sending || !socket?.connected}
//                   className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-45"
//                   aria-label="Send message"
//                   title="Send message"
//                 >
//                   <Send className="h-4 w-4" />
//                 </button>
//               </form>
//             </>
//           )}
//         </section>
//       )}

//       <button
//         type="button"
//         onClick={() => setOpen((current) => !current)}
//         className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
//         aria-label={open ? "Close messages" : "Open messages"}
//         title="Messages"
//       >
//         {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
//         {!open && unreadCount > 0 && (
//           <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-background">
//             {unreadCount > 99 ? "99+" : unreadCount}
//           </span>
//         )}
//       </button>
//     </div>
//   );
// };

// export default ChatWidget;

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Check, CheckCheck, MessageCircle, Minus, Send, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const ChatWidget = () => {
  const { user } = useAuth();
  const { socket, unreadCount, refreshUnread, setActiveContact } = useChat();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const contact = contacts.find(
    (item) => String(item.id || item._id) === contactId,
  );
  const ownId = String(user?.id || user?._id || "");

  useEffect(() => {
    if (location.pathname === "/chat") {
      setOpen(false);
      setContactId("");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/chat") return undefined;
    if (!open) {
      setActiveContact(null);
      return;
    }

    let mounted = true;
    setLoadingContacts(true);
    axios
      .get(`${API_URL}/api/chat/contacts`, { headers: getHeaders() })
      .then(({ data }) => {
        if (!mounted) return;
        setContacts(
          (data.data || []).map((item) => ({
            ...item,
            id: String(item.id || item._id),
          })),
        );
      })
      .catch(() => mounted && setError("Could not load chat contacts."))
      .finally(() => mounted && setLoadingContacts(false));
    return () => {
      mounted = false;
    };
  }, [open, location.pathname, setActiveContact]);

  useEffect(() => {
    if (location.pathname === "/chat") return undefined;
    if (!open || !contactId) {
      setActiveContact(null);
      return undefined;
    }

    setActiveContact(contactId);
    let mounted = true;
    setLoadingMessages(true);
    axios
      .get(`${API_URL}/api/chat/messages/${contactId}`, { headers: getHeaders() })
      .then(({ data }) => {
        if (!mounted) return;
        setMessages(
          data.data.map((message) => ({
            ...message,
            id: String(message._id),
            senderId: String(message.sender),
            recipientId: String(message.recipient),
          }))
        );
        setContacts((current) =>
          current.map((item) =>
            item.id === contactId ? { ...item, unreadCount: 0 } : item
          )
        );
        if (socket?.connected) {
          socket.emit("chat:read", { contactId }, () => refreshUnread());
        }
      })
      .catch(() => mounted && setError("Could not load this conversation."))
      .finally(() => mounted && setLoadingMessages(false));

    return () => {
      mounted = false;
    };
  }, [open, contactId, location.pathname, socket, refreshUnread, setActiveContact]);

  useEffect(() => {
    if (!open || !socket || location.pathname === "/chat") return undefined;
    const handleMessage = (message) => {
      const senderId = String(message.senderId);
      setContacts((current) =>
        current.map((item) =>
          item.id === senderId
            ? {
                ...item,
                lastMessage: { content: message.content, createdAt: message.createdAt },
                unreadCount:
                  senderId === contactId ? 0 : (item.unreadCount || 0) + 1,
              }
            : item
        )
      );
      if (senderId === contactId) {
        setMessages((current) =>
          current.some((item) => item.id === message.id) ? current : [...current, message]
        );
        socket.emit("chat:read", { contactId: senderId }, () => refreshUnread());
      }
    };
    const handleRead = (receipt) => {
      setMessages((current) =>
        current.map((message) =>
          message.senderId === ownId && message.recipientId === String(receipt.readerId)
            ? { ...message, readAt: receipt.readAt }
            : message
        )
      );
    };
    socket.on("chat:message", handleMessage);
    socket.on("chat:read", handleRead);
    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:read", handleRead);
    };
  }, [open, socket, contactId, location.pathname, ownId, refreshUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !contactId || !socket?.connected || sending) return;
    setSending(true);
    socket.emit("chat:send", { recipientId: contactId, content }, (response) => {
      setSending(false);
      if (!response?.status) {
        setError(response?.message || "Message could not be sent.");
        return;
      }
      const message = response.data;
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message]
      );
      setContacts((current) =>
        current.map((item) =>
          item.id === contactId
            ? { ...item, lastMessage: { content, createdAt: message.createdAt } }
            : item
        )
      );
      setDraft("");
    });
  };

  if (location.pathname === "/chat") return null;

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          className="flex h-[min(72dvh,560px)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10 dark:shadow-black/40"
          aria-label="Chat support"
        >
          {/* Header */}
          <header className="flex min-h-[64px] items-center gap-3 bg-gradient-to-r from-primary to-primary/90 px-4 text-primary-foreground">
            {contact ? (
              <button
                type="button"
                onClick={() => {
                  setContactId("");
                  setError("");
                }}
                className="rounded-full p-1.5 transition-colors hover:bg-white/15"
                aria-label="Back to contacts"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <MessageCircle className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-semibold tracking-tight">
                {contact?.name || "Messages"}
              </h2>
              <p className="mt-0.5 truncate text-xs text-primary-foreground/70">
                {contact
                  ? contact.role === "hr"
                    ? "Human Resources"
                    : contact.position || "Employee"
                  : "HR & employee support"}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 transition-colors hover:bg-white/15"
                aria-label="Minimize chat"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setContactId("");
                }}
                className="rounded-full p-1.5 transition-colors hover:bg-white/15"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 border-b border-destructive/20 bg-destructive/5 px-4 py-2.5 text-xs text-destructive"
            >
              <span className="leading-snug">{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 rounded p-0.5 text-base leading-none hover:bg-destructive/10"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Contacts list */}
          {!contact ? (
            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Choose someone to start or continue a conversation.
                </p>
              </div>

              {loadingContacts ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading contacts...</p>
                </div>
              ) : contacts.length ? (
                contacts.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setContactId(item.id);
                      setError("");
                    }}
                    className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted/70"
                  >
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 ring-2 ring-background">
                      {item.profileImage ? (
                        <img
                          src={item.profileImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(item.name)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </span>
                        {item.lastMessage?.createdAt && (
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.lastMessage?.content || item.position || item.email}
                      </span>
                    </span>
                    {item.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No chat contacts available.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-3 py-4">
                <p className="mx-auto mb-2 w-fit rounded-full border border-border/60 bg-card/80 px-3 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
                  Private conversation
                </p>

                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messages.length ? (
                  messages.map((message) => {
                    const ownMessage = message.senderId === ownId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                            ownMessage
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md border border-border/50 bg-card text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">
                            {message.content}
                          </p>
                          <span
                            className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                              ownMessage
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {ownMessage &&
                              (message.readAt ? (
                                <CheckCheck className="h-3.5 w-3.5" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              ))}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <MessageCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Say hello to {contact.name}
                    </p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                className="flex items-end gap-2 border-t border-border/60 bg-card p-3"
              >
                <textarea
                  rows={1}
                  maxLength={4000}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form.requestSubmit();
                    }
                  }}
                  placeholder="Write a message..."
                  aria-label="Write a message"
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending || !socket?.connected}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                  aria-label="Send message"
                  title="Send message"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
        aria-label={open ? "Close messages" : "Open messages"}
        title="Messages"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget