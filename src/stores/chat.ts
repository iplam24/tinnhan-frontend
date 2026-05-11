import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chatService } from '@/services/chatService';
import { useAuthStore } from './auth';

export const useChatStore = defineStore('chat', () => {
    const auth = useAuthStore();
    const contacts = ref<any[]>([]);
    const messages = ref<Record<number, any[]>>({}); // contactId -> messages[]
    const unreadCounts = ref<Record<number, number>>({});
    const isConnected = ref(false);
    const currentContactId = ref<number | null>(null);

    const allMessages = computed(() => messages.value);

    const setContacts = (newContacts: any[]) => {
        // Merge with existing metadata to preserve sorting and previews
        contacts.value = newContacts.map(nc => {
            const existing = contacts.value.find(c => c.id === nc.id);
            if (existing) {
                return {
                    ...nc,
                    lastMessage: existing.lastMessage || nc.lastMessage,
                    lastMessageTime: existing.lastMessageTime || nc.lastMessageTime
                };
            }
            return nc;
        });
    };

    const addMessage = (contactId: number, message: any) => {
        if (!messages.value[contactId]) {
            messages.value[contactId] = [];
        }
        
        // Avoid duplicates
        const isDuplicate = messages.value[contactId].some(m => 
            (message.id && m.id === message.id) || 
            (m.content === message.content && m.senderId === message.senderId && Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000)
        );

        // Always update last message metadata if it's the latest
        const index = contacts.value.findIndex(c => Number(c.id) === Number(contactId));
        if (index !== -1) {
            const currentLastTime = contacts.value[index].lastMessageTime ? new Date(contacts.value[index].lastMessageTime).getTime() : 0;
            const newTime = new Date(message.timestamp).getTime();
            
            if (newTime >= currentLastTime) {
                contacts.value[index].lastMessage = message.content;
                contacts.value[index].lastMessageTime = message.timestamp;
                
                // Force reactivity by creating a new reference if needed
                contacts.value = [...contacts.value];
            }
        }

        if (!isDuplicate) {
            messages.value[contactId].push(message);
        }
    };

    const initWebSocket = () => {
        if (isConnected.value || !auth.user) return;

        const onMessage = (msg: any) => {
            const contactId = Number(msg.senderId) === Number(auth.user?.id) ? Number(msg.receiverId) : Number(msg.senderId);
            addMessage(contactId, msg);

            // Global Notification logic
            if (msg.senderId !== auth.user?.id && msg.senderId !== currentContactId.value) {
                // Play notification sound
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                    audio.play();
                } catch (e) {}

                if (Notification.permission === 'granted') {
                    new Notification(`V-Edu: ${msg.senderName || 'Bạn bè'}`, {
                        body: msg.content,
                        icon: '/pwa-192x192.png'
                    });
                }
                
                // Increase unread count if needed
                if (!unreadCounts.value[contactId]) unreadCounts.value[contactId] = 0;
                unreadCounts.value[contactId]++;
            }
        };

        const onTyping = (typing: any) => {
            // Typing is handled in ChatView.vue usually, but could be global
        };

        chatService.connect(auth.user.id, onMessage, auth.token || undefined, onTyping);
        isConnected.value = true;
    };

    const clearUnread = (contactId: number) => {
        unreadCounts.value[contactId] = 0;
    };

    const setCurrentContact = (id: number | null) => {
        currentContactId.value = id;
        if (id) clearUnread(id);
    };

    return {
        contacts,
        messages,
        unreadCounts,
        isConnected,
        currentContactId,
        setContacts,
        addMessage,
        initWebSocket,
        clearUnread,
        setCurrentContact
    };
});
