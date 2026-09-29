const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendOTP, sendSMSOTP } = require('../utils/sendEmail');

// Helper to construct query for email or phone
const findUserByIdentifier = (identifier) => {
  if (!identifier) return {};
  const raw = identifier.toString().trim();
  if (raw.includes('@')) {
    return { email: raw.toLowerCase() };
  }
  const digits = raw.replace(/\D/g, '');
  const or = [
    { email: raw.toLowerCase() },
    { phone: raw }
  ];
  if (digits) {
    or.push({ phone: digits });
    or.push({ phone: `+91 ${digits}` });
    or.push({ phone: `+91${digits}` });
  }
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    // Allow optional spaces or dashes between digits
    const flexPattern = last10.split('').join('[\\s\\-]*');
    or.push({ phone: { $regex: flexPattern, $options: 'i' } });
  }
  return { $or: or };
};

// Mask email or phone for privacy
const maskDestination = (dest, channel) => {
  if (!dest) return '';
  if (channel === 'sms' || (!dest.includes('@') && /\d/.test(dest))) {
    const digits = dest.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `+91 ${digits.slice(0, 2)}****${digits.slice(-4)}`;
    }
    return dest;
  }
  const parts = dest.split('@');
  if (parts.length === 2) {
    const userPart = parts[0];
    const maskedUser = userPart.length > 2 
      ? userPart[0] + '***' + userPart[userPart.length - 1]
      : userPart + '***';
    return `${maskedUser}@${parts[1]}`;
  }
  return dest;
};

// Register User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Role safety: default to 'customer' unless registering initial admin
    const userRole = role === 'admin' ? 'admin' : 'customer';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: userRole
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login User (Supports Email OR Mobile Number)
exports.login = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your email or mobile number, and password.' });
    }

    const query = findUserByIdentifier(identifier);
    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No account found with these details.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please verify and try again.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update profile details
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add Address
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { name, phone, street, apartment, city, state, pincode, country, isDefault } = req.body;

    if (!name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Please fill in all required address fields.' });
    }

    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      name,
      phone,
      street,
      apartment: apartment || '',
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: isDefault || user.addresses.length === 0
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address saved successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// Update Address
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    const { name, phone, street, apartment, city, state, pincode, country, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    if (name) address.name = name;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (apartment !== undefined) address.apartment = apartment;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (country) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// Delete Address
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address removed.',
      addresses: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password - Generate & Send OTP via Email OR Mobile SMS
exports.forgotPassword = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const preferredChannel = (req.body.channel || (identifier.includes('@') ? 'email' : 'sms')).toLowerCase();

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide your registered Email or Mobile Number.' });
    }

    const query = findUserByIdentifier(identifier);
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered ClayVista account found with this email or mobile number.'
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    let dispatchedChannel = 'email';
    let targetDestination = user.email;

    if (preferredChannel === 'sms' && (user.phone || !identifier.includes('@'))) {
      dispatchedChannel = 'sms';
      targetDestination = user.phone || identifier;
      await sendSMSOTP(targetDestination, otp);
    } else {
      dispatchedChannel = 'email';
      targetDestination = user.email;
      await sendOTP(user.email, otp);
    }

    const masked = maskDestination(targetDestination, dispatchedChannel);

    res.status(200).json({
      success: true,
      message: dispatchedChannel === 'sms'
        ? `A 6-digit verification code has been dispatched via SMS to ${masked}`
        : `A 6-digit verification code has been dispatched to ${masked}`,
      channel: dispatchedChannel,
      destination: masked,
      identifier: user.email,
      phone: user.phone
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP (by Email OR Mobile Number)
exports.verifyOTP = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const otp = (req.body.otp || '').trim();

    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide your email/phone and the 6-digit OTP.' });
    }

    const userQuery = findUserByIdentifier(identifier);
    const user = await User.findOne({
      ...userQuery,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please check and try again.' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now choose your new password.',
      identifier: user.email
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password with OTP (by Email OR Mobile Number)
exports.resetPassword = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const otp = (req.body.otp || '').trim();
    const newPassword = req.body.newPassword;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please supply all required fields.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const userQuery = findUserByIdentifier(identifier);
    const user = await User.findOne({
      ...userQuery,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification session. Please request a new OTP.' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You are now signed in!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Change Password while logged in
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};
