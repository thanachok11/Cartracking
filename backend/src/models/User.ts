import mongoose, { Schema, Document, model, models } from 'mongoose';
import { PagePermission, UserRole, getDefaultPermissions, ALL_PERMISSIONS } from '../types/permissions';
import bcrypt from 'bcryptjs';

// Define an interface for the User document
export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profile_img: string;
    isActive: boolean;            // ← เพิ่ม isActive
    pagePermissions: PagePermission[];  // ← เพิ่ม pagePermissions
    lastLogin?: Date;             // ← เพิ่ม lastLogin
    createdAt: Date;
    updatedAt: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    
    // Instance methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    hasPermission(permission: PagePermission): boolean;
    canAccessPage(page: PagePermission): boolean;
    getPermissions(): PagePermission[];
}

// Define the schema for the User model
const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        role: {
            type: String,
            enum: ['super admin', 'admin', 'manager', 'user'],
            default: 'user',
        },
        profile_img: {
            type: String,
            default: 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg',
        },
        isActive: {
            type: Boolean,
            default: false,  // ← เพิ่ม default false
        },
        pagePermissions: {
            type: [String],
            enum: ALL_PERMISSIONS,
            default: function(this: IUser) {
                return getDefaultPermissions(this.role);
            }
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { 
            transform: function(doc, ret) {
                delete (ret as any).password;
                return ret;
            }
        }
    }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ pagePermissions: 1 });
UserSchema.index({ isActive: 1 });

// Pre-save middleware
UserSchema.pre('save', async function(this: IUser, next) {
    // Hash password if modified
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    
    // Set default pagePermissions if not set or empty
    if (this.isNew && (!this.pagePermissions || this.pagePermissions.length === 0)) {
        this.pagePermissions = getDefaultPermissions(this.role);
    }
    
    this.updatedAt = new Date();
    next();
});

// Instance methods
UserSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.hasPermission = function(this: IUser, permission: PagePermission): boolean {
    // Admin และ Super Admin มีสิทธิ์ทุกอย่าง
    if (['admin', 'super admin'].includes(this.role)) {
        return true;
    }
    
    return this.pagePermissions.includes(permission);
};

UserSchema.methods.canAccessPage = function(this: IUser, page: PagePermission): boolean {
    return this.hasPermission(page);
};

UserSchema.methods.getPermissions = function(this: IUser): PagePermission[] {
    // ใช้ getDefaultPermissions แทนการ hardcode
    return this.pagePermissions || getDefaultPermissions(this.role);
};

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
    return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.getActiveUsers = function() {
    return this.find({ isActive: true });
};

const User = models.User || model<IUser>('User', UserSchema);

export default User;
