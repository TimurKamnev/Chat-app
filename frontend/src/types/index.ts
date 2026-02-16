export interface IUser {
	_id: string
	fullName: string
	email: string
	profilePic?: string
	createdAt?: string
}

export interface IMessage {
	_id: string
	senderId: string
	receiverId: string
	image: string
	text: string
	createdAt: string
}

export interface LoginData {
	email: string
	password: string
}

export interface SignupData {
	fullName: string
	email: string
	password: string
}

export interface UpdateProfileData {
	fullName?: string
	profilePic?: string
}
