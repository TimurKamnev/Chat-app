import { create } from 'zustand'
import { axiosInstance } from '../lib/axios.js'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'
import type {
	IUser,
	LoginData,
	SignupData,
	UpdateProfileData,
} from '../types/index.js'
import type { AxiosError } from 'axios'

interface AuthState {
	authUser: IUser | null
	isSigningUp: boolean
	isLoggingIn: boolean
	isUpdatingProfile: boolean
	isCheckingAuth: boolean
	onlineUsers: string[]
	socket: Socket | null

	checkAuth: () => Promise<void>
	signup: (data: SignupData) => Promise<void>
	login: (data: LoginData) => Promise<void>
	logout: () => Promise<void>
	updateProfile: (data: UpdateProfileData) => Promise<void>
	connectSocket: () => void
	disconnectSocket: () => void
}

const BASE_URL =
	import.meta.env.MODE === 'development' ? 'http://localhost:5001' : '/'

export const useAuthStore = create<AuthState>((set, get) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isUpdatingProfile: false,
	isCheckingAuth: true,
	onlineUsers: [],
	socket: null,

	checkAuth: async () => {
		try {
			const res = await axiosInstance.get('/auth/check')

			set({ authUser: res.data })
			get().connectSocket()
		} catch (error) {
			console.log('Error in checkAuth:', error)
			set({ authUser: null })
		} finally {
			set({ isCheckingAuth: false })
		}
	},

	signup: async data => {
		set({ isSigningUp: true })
		try {
			const res = await axiosInstance.post('/auth/signup', data)
			set({ authUser: res.data })
			toast.success('Account created successfully')
			get().connectSocket()
		} catch (error) {
			const err = error as AxiosError<{ message: string }>
			toast.error(err.response?.data?.message || 'Signup failed')
		} finally {
			set({ isSigningUp: false })
		}
	},

	login: async data => {
		set({ isLoggingIn: true })
		try {
			const res = await axiosInstance.post('/auth/login', data)
			set({ authUser: res.data })
			toast.success('Logged in successfully')

			get().connectSocket()
		} catch (error) {
			const err = error as AxiosError<{ message: string }>
			toast.error(err.response?.data?.message || 'Login failed')
		} finally {
			set({ isLoggingIn: false })
		}
	},

	logout: async () => {
		try {
			await axiosInstance.post('/auth/logout')
			set({ authUser: null })
			toast.success('Logged out successfully')
			get().disconnectSocket()
		} catch (error) {
			const err = error as AxiosError<{ message: string }>
			toast.error(err.response?.data?.message || 'Logout failed')
		}
	},

	updateProfile: async (data: UpdateProfileData) => {
		set({ isUpdatingProfile: true })
		try {
			const res = await axiosInstance.put('/auth/update-profile', data)
			set({ authUser: res.data })
			toast.success('Profile updated successfully')
		} catch (error) {
			const err = error as AxiosError<{ message: string }>
			toast.error(err.response?.data?.message || 'Profile update failed')
		} finally {
			set({ isUpdatingProfile: false })
		}
	},

	connectSocket: () => {
		const { authUser } = get()
		if (!authUser || get().socket?.connected) return

		const socket = io(BASE_URL, {
			query: {
				userId: authUser._id,
			},
		})
		socket.connect()

		set({ socket: socket })

		socket.on('getOnlineUsers', userIds => {
			set({ onlineUsers: userIds })
		})
	},
	disconnectSocket: () => {
		const { socket } = get()
		if (socket?.connected) {
			socket.disconnect()
			set({ socket: null })
		}
	},
}))
