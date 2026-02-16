import { create } from 'zustand'
import toast from 'react-hot-toast'
import { axiosInstance } from '../lib/axios'
import { useAuthStore } from './useAuthStore'
import type { IMessage, IUser } from '../types'
import type { AxiosError } from 'axios'

interface ChatState {
	messages: IMessage[]
	users: IUser[]
	selectedUser: IUser | null
	isUsersLoading: boolean
	isMessagesLoading: boolean

	getUsers: () => Promise<void>
	getMessages: (userId: string) => Promise<void>
	sendMessage: (messageData: { text: string; image?: string | null }) => Promise<void>
	subscribeToMessages: () => void
	unsubscribeFromMessages: () => void
	setSelectedUser: (user: IUser | null) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
	messages: [],
	users: [],
	selectedUser: null,
	isUsersLoading: false,
	isMessagesLoading: false,

	getUsers: async () => {
		set({ isUsersLoading: true })
		try {
			const res = await axiosInstance.get('/messages/users')
			set({ users: res.data })
		} catch (error) {
			const err = error as AxiosError<{ message: string }>
			toast.error(err.response?.data?.message || 'Error fetching users')
		} finally {
			set({ isUsersLoading: false })
		}
	},

	getMessages: async (userId: string) => {
		set({ isMessagesLoading: true })
		try {
			const res = await axiosInstance.get(`/messages/${userId}`)
			set({ messages: res.data })
		} catch (error) {
			const err = error as AxiosError<{ message: string }>
			toast.error(err.response?.data?.message || 'Error fetching messages')
		} finally {
			set({ isMessagesLoading: false })
		}
	},
	sendMessage: async messageData => {
		const { selectedUser, messages } = get()
		try {
			const res = await axiosInstance.post(
				`/messages/send/${selectedUser?._id}`,
				messageData,
			)
			set({ messages: [...messages, res.data] })
		} catch (error) {
			const err = error as AxiosError<{ message: string }>
			toast.error(err.response?.data?.message || 'Error sending message')
		}
	},

	subscribeToMessages: () => {
		const { selectedUser } = get()
		if (!selectedUser) return

		const socket = useAuthStore.getState().socket
		if (!socket) return

		socket.on('newMessage', (newMessage: IMessage) => {
			const isMessageSentFromSelectedUser =
				newMessage.senderId === selectedUser._id
			if (!isMessageSentFromSelectedUser) return

			set({
				messages: [...get().messages, newMessage],
			})
		})
	},

	unsubscribeFromMessages: () => {
		const socket = useAuthStore.getState().socket
		socket?.off('newMessage')
	},

	setSelectedUser: selectedUser => set({ selectedUser }),
}))
