import User from '../models/user.model.js'
import { generateToken } from '../lib/utils.js'
import cloudinary from '../lib/cloudinary.js'
import bcrypt from 'bcryptjs'

export const signup = async (req, res) => {
	const { email, fullName, password } = req.body
	try {
		if (password.length < 6) {
			return res
				.status(400)
				.json({ message: 'Password must be at least 6 characters' })
		}

		const user = await User.findOne({ email })
		if (user) {
			return res.status(400).json({ message: 'Email already exists' })
		}

		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(password, salt)

		const newUser = new User({
			email: email,
			fullName: fullName,
			password: hashedPassword,
		})

		if (newUser) {
			generateToken(newUser._id, res)
			await newUser.save()

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				email: newUser.email,
				profilePic: newUser.profilePic,
			})
		} else {
			return res.status(400).json({ message: 'Invalid user data' })
		}
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
}

export const login = async (req, res) => {
	const { email, password } = req.body
	try {
		const user = await User.findOne({ email })

		if (!user) {
			return res.status(400).json({ message: 'User does not exist' })
		}

		const isMatch = await bcrypt.compare(password, user.password)

		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid password' })
		}

		generateToken(user._id, res)

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			email: user.email,
			profilePic: user.profilePic,
		})
	} catch (error) {
		console.log('Error in login:', error.message)
		res.status(500).json({ error: error.message })
	}
}

export const logout = (req, res) => {
	try {
		res.cookie('jwt', '', { maxAge: 0 })
		res.status(200).json({ message: 'Logged out successfully' })
	} catch (error) {
		console.log('Error in logout:', error.message)
		res.status(500).json({ error: error.message })
	}
}

export const updateProfile = async (req, res) => {
	try {
		const { profilePic } = req.body
		const userId = req.user._id

		if (!profilePic) {
			return res.status(400).json({ error: 'Profile picture is required' })
		}

		const upload = await cloudinary.uploader.upload(profilePic)

		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ profilePic: upload.secure_url },
			{ new: true },
		)

		res.status(200).json(updatedUser)
	} catch (error) {
		console.log('Error updating profile:', error.message)
		res.status(500).json({ error: error.message })
	}
}

export const checkAuth = (req, res) => {
	try {
		res.status(200).json(req.user)
	} catch (error) {
		console.log('Error checking auth:', error.message)
		res.status(500).json({ error: error.message })
	}
}
