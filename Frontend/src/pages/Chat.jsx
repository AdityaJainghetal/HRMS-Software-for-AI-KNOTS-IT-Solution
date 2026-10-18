// import { useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
// import {
//   ArrowLeft,
//   Check,
//   CheckCheck,
//   Circle,
//   LoaderCircle,
//   MessageCircle,
//   Search,
//   Send,
//   ShieldCheck,
//   Users,
// } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";
// import { useChat } from "../contexts/ChatContext";

// const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// const getHeaders = () => ({
//   Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
// });

// const getInitials = (name = "") =>
//   name
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((part) => part[0])
//     .join("")
//     .toUpperCase() || "?";

// const formatListTime = (value) => {
//   if (!value) return "";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "";
//   const today = new Date();
//   return date.toDateString() === today.toDateString()
//     ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
//     : date.toLocaleDateString([], { month: "short", day: "numeric" });
// };

// const formatMessageTime = (value) => {
//   const date = new Date(value);
//   return Number.isNaN(date.getTime())
//     ? ""
//     : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
// };

// const Chat = () => {
//   const { user } = useAuth();
//   const { socket, refreshUnread, setActiveContact } = useChat();
//   const [contacts, setContacts] = useState([]);
//   const [selectedId, setSelectedId] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [search, setSearch] = useState("");
//   const [draft, setDraft] = useState("");
//   const [loadingContacts, setLoadingContacts] = useState(true);
//   const [loadingMessages, setLoadingMessages] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState("");
//   const messagesEndRef = useRef(null);
//   const textareaRef = useRef(null);
//   const currentUserId = String(user?.id || user?._id || "");
//   const isHr = String(user?.role || "").toLowerCase() === "hr";
//   const selectedContact = contacts.find(
//     (contact) => String(contact.id) === selectedId,
//   );

//   useEffect(() => {
//     let active = true;
//     setLoadingContacts(true);

//     axios
//       .get(`${API_URL}/api/chat/contacts`, { headers: getHeaders() })
//       .then(({ data }) => {
//         if (!active) return;
//         const nextContacts = (data.data || []).map((contact) => ({
//           ...contact,
//           id: String(contact.id || contact._id),
//         }));
//         setContacts(nextContacts);
//       })
//       .catch(() => {
//         if (active) setError("Could not load chat contacts. Please try again.");
//       })
//       .finally(() => {
//         if (active) setLoadingContacts(false);
//       });

//     return () => {
//       active = false;
//       setActiveContact(null);
//     };
//   }, [setActiveContact]);

//   useEffect(() => {
//     setActiveContact(selectedId || null);
//     setError("");

//     if (!selectedId) {
//       setMessages([]);
//       setLoadingMessages(false);
//       return undefined;
//     }

//     let active = true;
//     setLoadingMessages(true);
//     setMessages([]);

//     axios
//       .get(`${API_URL}/api/chat/messages/${selectedId}`, {
//         headers: getHeaders(),
//       })
//       .then(({ data }) => {
//         if (!active) return;
//         const loadedMessages = (data.data || []).map((message) => ({
//           ...message,
//           id: String(message._id || message.id),
//           senderId: String(message.sender?._id || message.sender),
//           recipientId: String(message.recipient?._id || message.recipient),
//         }));
//         setMessages((current) => {
//           const liveMessages = current.filter(
//             (message) => !loadedMessages.some((item) => item.id === message.id),
//           );
//           return [...loadedMessages, ...liveMessages];
//         });
//         setContacts((current) =>
//           current.map((contact) =>
//             contact.id === selectedId ? { ...contact, unreadCount: 0 } : contact,
//           ),
//         );
//         if (socket?.connected) {
//           socket.emit("chat:read", { contactId: selectedId }, () =>
//             refreshUnread(),
//           );
//         }
//       })
//       .catch(() => {
//         if (active) setError("Could not load this conversation. Please retry.");
//       })
//       .finally(() => {
//         if (active) setLoadingMessages(false);
//       });

//     return () => {
//       active = false;
//     };
//   }, [selectedId, socket, refreshUnread, setActiveContact]);

//   useEffect(() => {
//     if (!socket) return undefined;

//     const handleMessage = (message) => {
//       const senderId = String(message.senderId);
//       const recipientId = String(message.recipientId);
//       const contactId =
//         senderId === currentUserId ? recipientId : senderId;
//       const normalizedMessage = {
//         ...message,
//         id: String(message.id || message._id),
//         senderId,
//         recipientId,
//       };

//       setContacts((current) =>
//         current.map((contact) =>
//           contact.id === contactId
//             ? {
//                 ...contact,
//                 lastMessage: {
//                   content: message.content,
//                   createdAt: message.createdAt,
//                 },
//                 unreadCount:
//                   contactId === selectedId
//                     ? 0
//                     : contact.unreadCount + (senderId === currentUserId ? 0 : 1),
//               }
//             : contact,
//         ),
//       );

//       if (contactId === selectedId) {
//         setMessages((current) =>
//           current.some((item) => item.id === normalizedMessage.id)
//             ? current
//             : [...current, normalizedMessage],
//         );
//         if (senderId !== currentUserId) {
//           socket.emit("chat:read", { contactId }, () => refreshUnread());
//         }
//       }
//     };

//     const handleRead = (receipt) => {
//       setMessages((current) =>
//         current.map((message) =>
//           message.senderId === currentUserId &&
//           message.recipientId === String(receipt.readerId)
//             ? { ...message, readAt: receipt.readAt }
//             : message,
//         ),
//       );
//     };

//     socket.on("chat:message", handleMessage);
//     socket.on("chat:read", handleRead);
//     return () => {
//       socket.off("chat:message", handleMessage);
//       socket.off("chat:read", handleRead);
//     };
//   }, [socket, selectedId, currentUserId, refreshUnread]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     const textarea = textareaRef.current;
//     if (!textarea) return;
//     textarea.style.height = "auto";
//     textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
//   }, [draft]);

//   const filteredContacts = useMemo(() => {
//     const query = search.trim().toLowerCase();
//     if (!query) return contacts;
//     return contacts.filter((contact) =>
//       `${contact.name} ${contact.email} ${contact.position || ""}`
//         .toLowerCase()
//         .includes(query),
//     );
//   }, [contacts, search]);

//   const selectContact = (contactId) => {
//     setError("");
//     setSelectedId(String(contactId));
//   };

//   const sendMessage = (event) => {
//     event.preventDefault();
//     const content = draft.trim();
//     if (!content || !selectedId || !socket?.connected || sending) return;

//     setSending(true);
//     setError("");
//     socket.emit(
//       "chat:send",
//       { recipientId: selectedId, content },
//       (response) => {
//         setSending(false);
//         if (!response?.status) {
//           setError(response?.message || "Message could not be sent.");
//           return;
//         }

//         const message = {
//           ...response.data,
//           id: String(response.data.id || response.data._id),
//           senderId: String(response.data.senderId || currentUserId),
//           recipientId: String(response.data.recipientId || selectedId),
//         };
//         setMessages((current) =>
//           current.some((item) => item.id === message.id)
//             ? current
//             : [...current, message],
//         );
//         setContacts((current) =>
//           current.map((contact) =>
//             contact.id === selectedId
//               ? {
//                   ...contact,
//                   lastMessage: { content, createdAt: message.createdAt },
//                 }
//               : contact,
//           ),
//         );
//         setDraft("");
//       },
//     );
//   };

//   return (
//     <section className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-screen-2xl flex-col bg-background sm:gap-4 sm:p-4 md:h-[calc(100dvh-4rem)] md:p-6 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:p-8">
//       <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 py-3 sm:rounded-xl sm:border sm:px-5 sm:py-4 sm:shadow-sm">
//         <div className="flex min-w-0 items-center gap-3">
//           <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
//             <MessageCircle className="h-5 w-5" />
//           </span>
//           <div className="min-w-0">
//             <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
//               Messages
//             </h1>
//             <p className="truncate text-xs text-muted-foreground sm:text-sm">
//               {isHr
//                 ? "Connect with employees across your organization"
//                 : "Chat privately with your HR team"}
//             </p>
//           </div>
//         </div>
//         <span className="hidden flex-shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
//           <span
//             className={`h-2 w-2 rounded-full ${
//               socket?.connected ? "bg-emerald-500" : "bg-amber-500"
//             }`}
//           />
//           {socket?.connected ? "Connected" : "Connecting"}
//         </span>
//       </div>

//       {error && (
//         <div
//           role="alert"
//           className="mx-3 flex flex-shrink-0 items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive sm:mx-0"
//         >
//           <span>{error}</span>
//           <button
//             type="button"
//             onClick={() => setError("")}
//             className="rounded px-2 py-1 hover:bg-destructive/10"
//             aria-label="Dismiss error"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="flex min-h-0 flex-1 overflow-hidden border-y border-border bg-card sm:rounded-xl sm:border sm:shadow-sm md:grid md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]">
//         <aside
//           className={`${
//             selectedContact ? "hidden md:flex" : "flex"
//           } min-h-0 w-full flex-col border-r border-border bg-card md:col-start-1 md:row-start-1`}
//           aria-label={isHr ? "Employee chats" : "HR chats"}
//         >
//           <div className="flex-shrink-0 border-b border-border px-4 py-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-sm font-semibold text-foreground">
//                   {isHr ? "Employees" : "HR team"}
//                 </h2>
//                 <p className="mt-0.5 text-xs text-muted-foreground">
//                   {isHr
//                     ? "Select an employee to start a chat"
//                     : "Your HR contacts"}
//                 </p>
//               </div>
//               <span className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
//                 <Users className="h-3.5 w-3.5" />
//                 {contacts.length}
//               </span>
//             </div>
//             <label className="mt-4 flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 text-muted-foreground transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
//               <Search className="h-4 w-4 flex-shrink-0" />
//               <input
//                 value={search}
//                 onChange={(event) => setSearch(event.target.value)}
//                 className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
//                 placeholder={isHr ? "Search employees" : "Search HR contacts"}
//                 aria-label="Search contacts"
//               />
//             </label>
//           </div>

//           <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
//             {loadingContacts ? (
//               <div className="flex flex-col items-center gap-3 px-4 py-12 text-sm text-muted-foreground">
//                 <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
//                 Loading contacts...
//               </div>
//             ) : filteredContacts.length ? (
//               filteredContacts.map((contact) => {
//                 const isActive = contact.id === selectedId;
//                 return (
//                   <button
//                     type="button"
//                     key={contact.id}
//                     onClick={() => selectContact(contact.id)}
//                     aria-current={isActive ? "true" : undefined}
//                     className={`flex w-full items-center gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors ${
//                       isActive
//                         ? "bg-primary/10"
//                         : "hover:bg-muted/70 active:bg-muted"
//                     }`}
//                   >
//                     <span className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
//                       {contact.profileImage ? (
//                         <img
//                           src={contact.profileImage}
//                           alt=""
//                           className="h-full w-full object-cover"
//                         />
//                       ) : (
//                         getInitials(contact.name)
//                       )}
//                       <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
//                     </span>
//                     <span className="min-w-0 flex-1">
//                       <span className="flex items-center justify-between gap-2">
//                         <span className="truncate text-sm font-medium text-foreground">
//                           {contact.name}
//                         </span>
//                         <span className="flex-shrink-0 text-[10px] text-muted-foreground">
//                           {formatListTime(contact.lastMessage?.createdAt)}
//                         </span>
//                       </span>
//                       <span className="mt-1 flex items-center justify-between gap-2">
//                         <span className="truncate text-xs text-muted-foreground">
//                           {contact.lastMessage?.content ||
//                             contact.position ||
//                             contact.email}
//                         </span>
//                         {contact.unreadCount > 0 && (
//                           <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
//                             {contact.unreadCount > 99
//                               ? "99+"
//                               : contact.unreadCount}
//                           </span>
//                         )}
//                       </span>
//                     </span>
//                   </button>
//                 );
//               })
//             ) : (
//               <div className="flex flex-col items-center px-6 py-14 text-center">
//                 <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
//                   <Users className="h-5 w-5" />
//                 </span>
//                 <p className="mt-3 text-sm font-medium text-foreground">
//                   {search ? "No contacts found" : "No contacts available"}
//                 </p>
//                 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
//                   {search
//                     ? "Try searching with a different name or email."
//                     : isHr
//                       ? "Employees will appear here when they are added."
//                       : "Your HR contacts will appear here."}
//                 </p>
//               </div>
//             )}
//           </div>
//         </aside>

//         <div
//           className={`${
//             selectedContact ? "flex" : "hidden md:flex"
//           } min-h-0 min-w-0 flex-1 flex-col bg-background md:col-start-2 md:row-start-1`}
//         >
//           {selectedContact ? (
//             <>
//               <header className="flex min-h-[68px] flex-shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-5">
//                 <button
//                   type="button"
//                   onClick={() => setSelectedId("")}
//                   className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
//                   aria-label="Back to contacts"
//                 >
//                   <ArrowLeft className="h-5 w-5" />
//                 </button>
//                 <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
//                   {selectedContact.profileImage ? (
//                     <img
//                       src={selectedContact.profileImage}
//                       alt=""
//                       className="h-full w-full object-cover"
//                     />
//                   ) : (
//                     getInitials(selectedContact.name)
//                   )}
//                 </span>
//                 <div className="min-w-0 flex-1">
//                   <h2 className="truncate text-sm font-semibold text-foreground">
//                     {selectedContact.name}
//                   </h2>
//                   <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
//                     <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
//                     {selectedContact.role === "hr"
//                       ? "Human Resources"
//                       : selectedContact.position || "Employee"}
//                   </p>
//                 </div>
//                 <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
//                   <ShieldCheck className="h-4 w-4 text-primary" />
//                   Private chat
//                 </div>
//               </header>

//               <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6">
//                 <div className="mx-auto mb-5 flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
//                   <ShieldCheck className="h-3.5 w-3.5 text-primary" />
//                   Messages are private between you and {selectedContact.name}
//                 </div>

//                 {loadingMessages ? (
//                   <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
//                     <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
//                     Loading conversation...
//                   </div>
//                 ) : messages.length ? (
//                   <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
//                     {messages.map((message) => {
//                       const ownMessage = message.senderId === currentUserId;
//                       return (
//                         <div
//                           key={message.id}
//                           className={`flex ${
//                             ownMessage ? "justify-end" : "justify-start"
//                           }`}
//                         >
//                           <div
//                             className={`max-w-[88%] break-words px-4 py-2.5 shadow-sm sm:max-w-[75%] ${
//                               ownMessage
//                                 ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
//                                 : "rounded-2xl rounded-bl-md border border-border bg-card text-foreground"
//                             }`}
//                           >
//                             <p className="whitespace-pre-wrap text-sm leading-relaxed">
//                               {message.content}
//                             </p>
//                             <span
//                               className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
//                                 ownMessage
//                                   ? "text-primary-foreground/70"
//                                   : "text-muted-foreground"
//                               }`}
//                             >
//                               {formatMessageTime(message.createdAt)}
//                               {ownMessage &&
//                                 (message.readAt ? (
//                                   <CheckCheck className="h-3.5 w-3.5" />
//                                 ) : (
//                                   <Check className="h-3.5 w-3.5" />
//                                 ))}
//                             </span>
//                           </div>
//                         </div>
//                       );
//                     })}
//                     <div ref={messagesEndRef} />
//                   </div>
//                 ) : (
//                   <div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
//                     <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
//                       <MessageCircle className="h-6 w-6" />
//                     </span>
//                     <h3 className="mt-4 text-sm font-semibold text-foreground">
//                       Start a conversation
//                     </h3>
//                     <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
//                       Send a message to {selectedContact.name} to begin your
//                       private chat.
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <form
//                 onSubmit={sendMessage}
//                 className="flex flex-shrink-0 items-end gap-2 border-t border-border bg-card p-3 sm:gap-3 sm:px-5 sm:py-4"
//               >
//                 <label className="flex min-h-11 min-w-0 flex-1 items-end rounded-xl border border-input bg-background px-3 transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
//                   <textarea
//                     ref={textareaRef}
//                     rows={1}
//                     maxLength={4000}
//                     value={draft}
//                     onChange={(event) => setDraft(event.target.value)}
//                     onKeyDown={(event) => {
//                       if (event.key === "Enter" && !event.shiftKey) {
//                         event.preventDefault();
//                         event.currentTarget.form?.requestSubmit();
//                       }
//                     }}
//                     className="max-h-[120px] min-h-10 w-full resize-none bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
//                     placeholder="Write a message..."
//                     aria-label="Write a message"
//                   />
//                 </label>
//                 <button
//                   type="submit"
//                   disabled={!draft.trim() || sending || !socket?.connected}
//                   className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
//                   aria-label="Send message"
//                   title={socket?.connected ? "Send message" : "Connecting"}
//                 >
//                   {sending ? (
//                     <LoaderCircle className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Send className="h-4 w-4" />
//                   )}
//                 </button>
//               </form>
//             </>
//           ) : (
//             <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
//               <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
//                 <MessageCircle className="h-7 w-7" />
//               </span>
//               <h2 className="mt-5 text-base font-semibold text-foreground">
//                 Select a contact
//               </h2>
//               <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
//                 {isHr
//                   ? "Choose an employee from the list to view your conversation or send a message."
//                   : "Choose an HR contact from the list to view your conversation or send a message."}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default Chat;

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
  LoaderCircle,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
});

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const formatListTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatMessageTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const Chat = () => {
  const { user } = useAuth();
  const { socket, refreshUnread, setActiveContact } = useChat();
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const currentUserId = String(user?.id || user?._id || "");
  const isHr = String(user?.role || "").toLowerCase() === "hr";
  const selectedContact = contacts.find(
    (contact) => String(contact.id) === selectedId,
  );

  useEffect(() => {
    let active = true;
    setLoadingContacts(true);

    axios
      .get(`${API_URL}/api/chat/contacts`, { headers: getHeaders() })
      .then(({ data }) => {
        if (!active) return;
        const nextContacts = (data.data || []).map((contact) => ({
          ...contact,
          id: String(contact.id || contact._id),
        }));
        setContacts(nextContacts);
      })
      .catch(() => {
        if (active) setError("Could not load chat contacts. Please try again.");
      })
      .finally(() => {
        if (active) setLoadingContacts(false);
      });

    return () => {
      active = false;
      setActiveContact(null);
    };
  }, [setActiveContact]);

  useEffect(() => {
    setActiveContact(selectedId || null);
    setError("");

    if (!selectedId) {
      setMessages([]);
      setLoadingMessages(false);
      return undefined;
    }

    let active = true;
    setLoadingMessages(true);
    setMessages([]);

    axios
      .get(`${API_URL}/api/chat/messages/${selectedId}`, {
        headers: getHeaders(),
      })
      .then(({ data }) => {
        if (!active) return;
        const loadedMessages = (data.data || []).map((message) => ({
          ...message,
          id: String(message._id || message.id),
          senderId: String(message.sender?._id || message.sender),
          recipientId: String(message.recipient?._id || message.recipient),
        }));
        setMessages((current) => {
          const liveMessages = current.filter(
            (message) => !loadedMessages.some((item) => item.id === message.id),
          );
          return [...loadedMessages, ...liveMessages];
        });
        setContacts((current) =>
          current.map((contact) =>
            contact.id === selectedId ? { ...contact, unreadCount: 0 } : contact,
          ),
        );
        if (socket?.connected) {
          socket.emit("chat:read", { contactId: selectedId }, () =>
            refreshUnread(),
          );
        }
      })
      .catch(() => {
        if (active) setError("Could not load this conversation. Please retry.");
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId, socket, refreshUnread, setActiveContact]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleMessage = (message) => {
      const senderId = String(message.senderId);
      const recipientId = String(message.recipientId);
      const contactId =
        senderId === currentUserId ? recipientId : senderId;
      const normalizedMessage = {
        ...message,
        id: String(message.id || message._id),
        senderId,
        recipientId,
      };

      setContacts((current) =>
        current.map((contact) =>
          contact.id === contactId
            ? {
                ...contact,
                lastMessage: {
                  content: message.content,
                  createdAt: message.createdAt,
                },
                unreadCount:
                  contactId === selectedId
                    ? 0
                    : contact.unreadCount + (senderId === currentUserId ? 0 : 1),
              }
            : contact,
        ),
      );

      if (contactId === selectedId) {
        setMessages((current) =>
          current.some((item) => item.id === normalizedMessage.id)
            ? current
            : [...current, normalizedMessage],
        );
        if (senderId !== currentUserId) {
          socket.emit("chat:read", { contactId }, () => refreshUnread());
        }
      }
    };

    const handleRead = (receipt) => {
      setMessages((current) =>
        current.map((message) =>
          message.senderId === currentUserId &&
          message.recipientId === String(receipt.readerId)
            ? { ...message, readAt: receipt.readAt }
            : message,
        ),
      );
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:read", handleRead);
    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:read", handleRead);
    };
  }, [socket, selectedId, currentUserId, refreshUnread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [draft]);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) =>
      `${contact.name} ${contact.email} ${contact.position || ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [contacts, search]);

  const selectContact = (contactId) => {
    setError("");
    setSelectedId(String(contactId));
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selectedId || !socket?.connected || sending) return;

    setSending(true);
    setError("");
    socket.emit(
      "chat:send",
      { recipientId: selectedId, content },
      (response) => {
        setSending(false);
        if (!response?.status) {
          setError(response?.message || "Message could not be sent.");
          return;
        }

        const message = {
          ...response.data,
          id: String(response.data.id || response.data._id),
          senderId: String(response.data.senderId || currentUserId),
          recipientId: String(response.data.recipientId || selectedId),
        };
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
        setContacts((current) =>
          current.map((contact) =>
            contact.id === selectedId
              ? {
                  ...contact,
                  lastMessage: { content, createdAt: message.createdAt },
                }
              : contact,
          ),
        );
        setDraft("");
      },
    );
  };

  return (
    <>
      <style>{`
        .chat-page {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 1536px;
          margin: 0 auto;
          height: calc(100dvh - 4rem);
          background: var(--background, #fff);
        }

        .chat-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-shrink: 0;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: var(--card, #fff);
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .chat-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 12px;
          background: color-mix(in srgb, var(--primary, #16a34a) 12%, transparent);
          color: var(--primary, #16a34a);
        }

        .chat-header-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--foreground, #111);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-header-sub {
          margin: 0;
          font-size: 0.75rem;
          color: var(--muted-foreground, #6b7280);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-status-badge {
          display: none;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          background: var(--muted, #f3f4f6);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .chat-status-dot.online { background: #10b981; }
        .chat-status-dot.offline { background: #f59e0b; }

        .chat-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-shrink: 0;
          margin: 0.5rem 0.75rem 0;
          padding: 0.625rem 1rem;
          border-radius: 8px;
          border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
          background: color-mix(in srgb, #ef4444 5%, transparent);
          font-size: 0.875rem;
          color: #dc2626;
        }

        .chat-error button {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: inherit;
        }
        .chat-error button:hover {
          background: color-mix(in srgb, #ef4444 10%, transparent);
        }

        .chat-shell {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          border-top: 1px solid var(--border, #e5e7eb);
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: var(--card, #fff);
        }

        /* ── Sidebar ── */
        .chat-sidebar {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 0;
          border-right: 1px solid var(--border, #e5e7eb);
          background: var(--card, #fff);
        }
        .chat-sidebar.hidden-mobile {
          display: none;
        }

        .chat-sidebar-header {
          flex-shrink: 0;
          padding: 1rem;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .chat-sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-sidebar-title {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--foreground, #111);
        }

        .chat-sidebar-desc {
          margin: 0.125rem 0 0;
          font-size: 0.75rem;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-count-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          min-width: 32px;
          height: 32px;
          padding: 0 0.5rem;
          border-radius: 9999px;
          background: var(--muted, #f3f4f6);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          height: 40px;
          margin-top: 1rem;
          padding: 0 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--input, #e5e7eb);
          background: var(--background, #fff);
          color: var(--muted-foreground, #6b7280);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .chat-search:focus-within {
          border-color: var(--ring, #16a34a);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring, #16a34a) 20%, transparent);
        }

        .chat-search input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.875rem;
          color: var(--foreground, #111);
        }
        .chat-search input::placeholder {
          color: var(--muted-foreground, #6b7280);
        }

        .chat-contact-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .chat-contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          border-bottom: 1px solid color-mix(in srgb, var(--border, #e5e7eb) 70%, transparent);
          background: transparent;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }
        .chat-contact-item:hover {
          background: color-mix(in srgb, var(--muted, #f3f4f6) 70%, transparent);
        }
        .chat-contact-item:active {
          background: var(--muted, #f3f4f6);
        }
        .chat-contact-item.active {
          background: color-mix(in srgb, var(--primary, #16a34a) 10%, transparent);
        }

        .chat-avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 50%;
          background: color-mix(in srgb, var(--primary, #16a34a) 10%, transparent);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary, #16a34a);
          overflow: hidden;
        }
        .chat-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .chat-avatar-online {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--card, #fff);
          background: #10b981;
        }

        .chat-contact-info {
          flex: 1;
          min-width: 0;
        }

        .chat-contact-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .chat-contact-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground, #111);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-contact-time {
          flex-shrink: 0;
          font-size: 10px;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-contact-preview {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--muted-foreground, #6b7280);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-unread {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          flex-shrink: 0;
          padding: 0 0.375rem;
          border-radius: 9999px;
          background: var(--primary, #16a34a);
          font-size: 10px;
          font-weight: 600;
          color: var(--primary-foreground, #fff);
        }

        .chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3.5rem 1.5rem;
          text-align: center;
        }

        .chat-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--muted, #f3f4f6);
          color: var(--muted-foreground, #6b7280);
        }

        .chat-empty-title {
          margin: 0.75rem 0 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground, #111);
        }

        .chat-empty-desc {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          line-height: 1.5;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 3rem 1rem;
          font-size: 0.875rem;
          color: var(--muted-foreground, #6b7280);
        }

        /* ── Conversation panel ── */
        .chat-panel {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          min-height: 0;
          background: var(--background, #fff);
        }
        .chat-panel.hidden-mobile {
          display: none;
        }

        .chat-panel-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-height: 68px;
          flex-shrink: 0;
          padding: 0 0.75rem;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: var(--card, #fff);
        }

        .chat-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--muted-foreground, #6b7280);
          cursor: pointer;
          transition: background 0.15s;
        }
        .chat-back-btn:hover {
          background: var(--muted, #f3f4f6);
        }

        .chat-panel-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 50%;
          background: color-mix(in srgb, var(--primary, #16a34a) 10%, transparent);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary, #16a34a);
          overflow: hidden;
        }
        .chat-panel-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .chat-panel-info {
          flex: 1;
          min-width: 0;
        }

        .chat-panel-name {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--foreground, #111);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-panel-role {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin: 0.125rem 0 0;
          font-size: 0.75rem;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-private-badge {
          display: none;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 1rem 0.75rem;
        }

        .chat-privacy-note {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          width: fit-content;
          margin: 0 auto 1.25rem;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--card, #fff);
          font-size: 11px;
          color: var(--muted-foreground, #6b7280);
        }

        .chat-messages-inner {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          max-width: 48rem;
          margin: 0 auto;
        }

        .chat-bubble-row {
          display: flex;
        }
        .chat-bubble-row.own {
          justify-content: flex-end;
        }
        .chat-bubble-row.other {
          justify-content: flex-start;
        }

        .chat-bubble {
          max-width: 88%;
          padding: 0.625rem 1rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          word-break: break-word;
        }
        .chat-bubble.own {
          border-radius: 1rem 1rem 0.25rem 1rem;
          background: var(--primary, #16a34a);
          color: var(--primary-foreground, #fff);
        }
        .chat-bubble.other {
          border-radius: 1rem 1rem 1rem 0.25rem;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--card, #fff);
          color: var(--foreground, #111);
        }

        .chat-bubble-text {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .chat-bubble-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.25rem;
          margin-top: 0.25rem;
          font-size: 10px;
        }
        .chat-bubble.own .chat-bubble-meta {
          color: color-mix(in srgb, var(--primary-foreground, #fff) 70%, transparent);
        }
        .chat-bubble.other .chat-bubble-meta {
          color: var(--muted-foreground, #6b7280);
        }

        .chat-start-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          padding: 0 1.25rem;
          text-align: center;
        }

        .chat-start-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--primary, #16a34a) 10%, transparent);
          color: var(--primary, #16a34a);
        }

        .chat-composer {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          flex-shrink: 0;
          padding: 0.75rem;
          border-top: 1px solid var(--border, #e5e7eb);
          background: var(--card, #fff);
        }

        .chat-composer-input {
          display: flex;
          align-items: flex-end;
          flex: 1;
          min-width: 0;
          min-height: 44px;
          padding: 0 0.75rem;
          border-radius: 12px;
          border: 1px solid var(--input, #e5e7eb);
          background: var(--background, #fff);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .chat-composer-input:focus-within {
          border-color: var(--ring, #16a34a);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring, #16a34a) 20%, transparent);
        }

        .chat-composer-input textarea {
          width: 100%;
          min-height: 40px;
          max-height: 120px;
          padding: 0.625rem 0;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          font-size: 0.875rem;
          color: var(--foreground, #111);
          font-family: inherit;
        }
        .chat-composer-input textarea::placeholder {
          color: var(--muted-foreground, #6b7280);
        }

        .chat-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border: none;
          border-radius: 12px;
          background: var(--primary, #16a34a);
          color: var(--primary-foreground, #fff);
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .chat-send-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .chat-select-empty {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 1.5rem;
          text-align: center;
        }

        .chat-select-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--primary, #16a34a) 10%, transparent);
          color: var(--primary, #16a34a);
        }

        /* ── Responsive ── */
        @media (min-width: 640px) {
          .chat-page {
            gap: 1rem;
            padding: 1rem;
          }

          .chat-header-bar {
            border-radius: 12px;
            border: 1px solid var(--border, #e5e7eb);
            padding: 1rem 1.25rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          }

          .chat-header-title {
            font-size: 1.25rem;
          }

          .chat-header-sub {
            font-size: 0.875rem;
          }

          .chat-status-badge {
            display: inline-flex;
          }

          .chat-error {
            margin-left: 0;
            margin-right: 0;
          }

          .chat-shell {
            border-radius: 12px;
            border: 1px solid var(--border, #e5e7eb);
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          }

          .chat-panel-header {
            padding: 0 1.25rem;
          }

          .chat-private-badge {
            display: flex;
          }

          .chat-messages {
            padding: 1rem 1.5rem;
          }

          .chat-bubble {
            max-width: 75%;
          }

          .chat-composer {
            gap: 0.75rem;
            padding: 1rem 1.25rem;
          }

          .chat-back-btn {
            display: none;
          }
        }

        @media (min-width: 768px) {
          .chat-page {
            padding: 1.5rem;
          }

          .chat-shell {
            display: grid;
            grid-template-columns: minmax(15rem, 20rem) minmax(0, 1fr);
          }

          .chat-sidebar {
            display: flex !important;
            width: auto;
          }

          .chat-sidebar.hidden-mobile {
            display: flex !important;
          }

          .chat-panel {
            display: flex !important;
          }

          .chat-panel.hidden-mobile {
            display: flex !important;
          }
        }

        @media (min-width: 1024px) {
          .chat-page {
            height: 100vh;
            min-height: 0;
            overflow: hidden;
            padding: 2rem;
          }
        }
      `}</style>

      <section className="chat-page">
        {/* Top bar */}
        <div className="chat-header-bar">
          <div className="chat-header-left">
            <span className="chat-header-icon">
              <MessageCircle size={20} />
            </span>
            <div>
              <h1 className="chat-header-title">Messages</h1>
              <p className="chat-header-sub">
                {isHr
                  ? "Connect with employees across your organization"
                  : "Chat privately with your HR team"}
              </p>
            </div>
          </div>
          <span className="chat-status-badge">
            <span
              className={`chat-status-dot ${
                socket?.connected ? "online" : "offline"
              }`}
            />
            {socket?.connected ? "Connected" : "Connecting"}
          </span>
        </div>

        {error && (
          <div className="chat-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        <div className="chat-shell">
          {/* Sidebar */}
          <aside
            className={`chat-sidebar ${selectedContact ? "hidden-mobile" : ""}`}
            aria-label={isHr ? "Employee chats" : "HR chats"}
          >
            <div className="chat-sidebar-header">
              <div className="chat-sidebar-top">
                <div>
                  <h2 className="chat-sidebar-title">
                    {isHr ? "Employees" : "HR team"}
                  </h2>
                  <p className="chat-sidebar-desc">
                    {isHr
                      ? "Select an employee to start a chat"
                      : "Your HR contacts"}
                  </p>
                </div>
                <span className="chat-count-badge">
                  <Users size={14} />
                  {contacts.length}
                </span>
              </div>
              <label className="chat-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isHr ? "Search employees" : "Search HR contacts"}
                  aria-label="Search contacts"
                />
              </label>
            </div>

            <div className="chat-contact-list">
              {loadingContacts ? (
                <div className="chat-loading">
                  <LoaderCircle size={24} className="animate-spin" style={{ color: "var(--primary, #16a34a)" }} />
                  Loading contacts...
                </div>
              ) : filteredContacts.length ? (
                filteredContacts.map((contact) => {
                  const isActive = contact.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={contact.id}
                      onClick={() => selectContact(contact.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={`chat-contact-item ${isActive ? "active" : ""}`}
                    >
                      <span className="chat-avatar">
                        {contact.profileImage ? (
                          <img src={contact.profileImage} alt="" />
                        ) : (
                          getInitials(contact.name)
                        )}
                        <span className="chat-avatar-online" />
                      </span>
                      <span className="chat-contact-info">
                        <span className="chat-contact-row">
                          <span className="chat-contact-name">{contact.name}</span>
                          <span className="chat-contact-time">
                            {formatListTime(contact.lastMessage?.createdAt)}
                          </span>
                        </span>
                        <span className="chat-contact-row" style={{ marginTop: 4 }}>
                          <span className="chat-contact-preview">
                            {contact.lastMessage?.content ||
                              contact.position ||
                              contact.email}
                          </span>
                          {contact.unreadCount > 0 && (
                            <span className="chat-unread">
                              {contact.unreadCount > 99
                                ? "99+"
                                : contact.unreadCount}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="chat-empty-state">
                  <span className="chat-empty-icon">
                    <Users size={20} />
                  </span>
                  <p className="chat-empty-title">
                    {search ? "No contacts found" : "No contacts available"}
                  </p>
                  <p className="chat-empty-desc">
                    {search
                      ? "Try searching with a different name or email."
                      : isHr
                        ? "Employees will appear here when they are added."
                        : "Your HR contacts will appear here."}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Conversation */}
          <div className={`chat-panel ${selectedContact ? "" : "hidden-mobile"}`}>
            {selectedContact ? (
              <>
                <header className="chat-panel-header">
                  <button
                    type="button"
                    onClick={() => setSelectedId("")}
                    className="chat-back-btn"
                    aria-label="Back to contacts"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <span className="chat-panel-avatar">
                    {selectedContact.profileImage ? (
                      <img src={selectedContact.profileImage} alt="" />
                    ) : (
                      getInitials(selectedContact.name)
                    )}
                  </span>
                  <div className="chat-panel-info">
                    <h2 className="chat-panel-name">{selectedContact.name}</h2>
                    <p className="chat-panel-role">
                      <Circle size={8} fill="#10b981" color="#10b981" />
                      {selectedContact.role === "hr"
                        ? "Human Resources"
                        : selectedContact.position || "Employee"}
                    </p>
                  </div>
                  <div className="chat-private-badge">
                    <ShieldCheck size={16} style={{ color: "var(--primary, #16a34a)" }} />
                    Private chat
                  </div>
                </header>

                <div className="chat-messages">
                  <div className="chat-privacy-note">
                    <ShieldCheck size={14} style={{ color: "var(--primary, #16a34a)" }} />
                    Messages are private between you and {selectedContact.name}
                  </div>

                  {loadingMessages ? (
                    <div className="chat-loading">
                      <LoaderCircle size={24} style={{ color: "var(--primary, #16a34a)" }} />
                      Loading conversation...
                    </div>
                  ) : messages.length ? (
                    <div className="chat-messages-inner">
                      {messages.map((message) => {
                        const ownMessage = message.senderId === currentUserId;
                        return (
                          <div
                            key={message.id}
                            className={`chat-bubble-row ${ownMessage ? "own" : "other"}`}
                          >
                            <div className={`chat-bubble ${ownMessage ? "own" : "other"}`}>
                              <p className="chat-bubble-text">{message.content}</p>
                              <span className="chat-bubble-meta">
                                {formatMessageTime(message.createdAt)}
                                {ownMessage &&
                                  (message.readAt ? (
                                    <CheckCheck size={14} />
                                  ) : (
                                    <Check size={14} />
                                  ))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="chat-start-empty">
                      <span className="chat-start-icon">
                        <MessageCircle size={24} />
                      </span>
                      <h3 className="chat-empty-title" style={{ marginTop: 16 }}>
                        Start a conversation
                      </h3>
                      <p className="chat-empty-desc">
                        Send a message to {selectedContact.name} to begin your private chat.
                      </p>
                    </div>
                  )}
                </div>

                <form onSubmit={sendMessage} className="chat-composer">
                  <label className="chat-composer-input">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      maxLength={4000}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder="Write a message..."
                      aria-label="Write a message"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending || !socket?.connected}
                    className="chat-send-btn"
                    aria-label="Send message"
                    title={socket?.connected ? "Send message" : "Connecting"}
                  >
                    {sending ? (
                      <LoaderCircle size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-select-empty">
                <span className="chat-select-icon">
                  <MessageCircle size={28} />
                </span>
                <h2 className="chat-empty-title" style={{ marginTop: 20, fontSize: "1rem" }}>
                  Select a contact
                </h2>
                <p className="chat-empty-desc" style={{ maxWidth: 280, fontSize: "0.875rem" }}>
                  {isHr
                    ? "Choose an employee from the list to view your conversation or send a message."
                    : "Choose an HR contact from the list to view your conversation or send a message."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Chat;