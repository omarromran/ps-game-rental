require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log(err));

const createAdmin = async () => {
    try {

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            email: 'omar@gmail.com'
        });

        if (existingAdmin) {
            console.log('⚠️ Admin already exists');
            process.exit();
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('omar123', 10);

        // Create admin
        const admin = new User({
            username: 'omarromran',
            email: 'omar@gmail.com',
            password: hashedPassword,
            role: 'Admin',

            approved: true,
            suspended: false,
            balance: 0
        });

        await admin.save();

        console.log('✅ Admin created successfully');
        console.log(admin);

        process.exit();

    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();