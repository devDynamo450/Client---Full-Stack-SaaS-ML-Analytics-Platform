import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.model';
import { Project } from './models/Project.model';
import { Task } from './models/Task.model';
import { Payment } from './models/Payment.model';
import { Activity } from './models/Activity.model';
import { Notification } from './models/Notification.model';
import { generateTransactionId } from './utils/jwt.utils';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectflow';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Payment.deleteMany({}),
      Activity.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Create Users ──────────────────────────────────────────────────────────
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@projectflow.com',
      password: 'admin123',
      role: 'admin',
      subscription: { plan: 'enterprise', status: 'active', startDate: new Date() },
    });

    const managerUser = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@projectflow.com',
      password: 'password123',
      role: 'manager',
      subscription: { plan: 'pro', status: 'active', startDate: new Date() },
    });

    const memberUser1 = await User.create({
      name: 'Alex Chen',
      email: 'alex@projectflow.com',
      password: 'password123',
      role: 'member',
      subscription: { plan: 'starter', status: 'active', startDate: new Date() },
    });

    const memberUser2 = await User.create({
      name: 'Maria Garcia',
      email: 'maria@projectflow.com',
      password: 'password123',
      role: 'member',
      subscription: { plan: 'free', status: 'active', startDate: new Date() },
    });

    const guestUser = await User.create({
      name: 'Guest Demo',
      email: 'guest@projectflow.com',
      password: 'password123',
      role: 'guest',
      subscription: { plan: 'free', status: 'active', startDate: new Date() },
    });

    console.log('👥 Created 5 users');

    // ── Create Projects ────────────────────────────────────────────────────────
    const project1 = await Project.create({
      name: 'E-Commerce Platform Redesign',
      description: 'Complete overhaul of the customer-facing shopping experience with modern UI/UX',
      status: 'active',
      owner: managerUser._id,
      members: [
        { user: managerUser._id, role: 'owner', joinedAt: new Date() },
        { user: adminUser._id, role: 'admin', joinedAt: new Date() },
        { user: memberUser1._id, role: 'member', joinedAt: new Date() },
        { user: memberUser2._id, role: 'member', joinedAt: new Date() },
      ],
      tags: ['design', 'frontend', 'e-commerce'],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      coverColor: '#6366f1',
    });

    const project2 = await Project.create({
      name: 'Mobile App MVP',
      description: 'Build the iOS and Android apps for our core product offering',
      status: 'planning',
      owner: adminUser._id,
      members: [
        { user: adminUser._id, role: 'owner', joinedAt: new Date() },
        { user: memberUser1._id, role: 'member', joinedAt: new Date() },
      ],
      tags: ['mobile', 'react-native', 'mvp'],
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      coverColor: '#f59e0b',
    });

    const project3 = await Project.create({
      name: 'Data Analytics Dashboard',
      description: 'Real-time analytics dashboard for business intelligence reporting',
      status: 'active',
      owner: memberUser1._id,
      members: [
        { user: memberUser1._id, role: 'owner', joinedAt: new Date() },
        { user: managerUser._id, role: 'admin', joinedAt: new Date() },
      ],
      tags: ['analytics', 'backend', 'data'],
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      coverColor: '#10b981',
    });

    console.log('📁 Created 3 projects');

    // ── Create Tasks ────────────────────────────────────────────────────────────
    type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
    type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
    const taskData: { title: string; status: TaskStatus; priority: TaskPriority; project: mongoose.Types.ObjectId; assignee?: mongoose.Types.ObjectId; reporter: mongoose.Types.ObjectId }[] = [
      // Project 1 tasks
      { title: 'Design new homepage wireframes', status: 'done', priority: 'high', project: project1._id, assignee: memberUser2._id, reporter: managerUser._id },
      { title: 'Implement product listing page', status: 'in_progress', priority: 'high', project: project1._id, assignee: memberUser1._id, reporter: managerUser._id },
      { title: 'Setup payment gateway integration', status: 'todo', priority: 'urgent', project: project1._id, assignee: memberUser1._id, reporter: adminUser._id },
      { title: 'Write unit tests for checkout flow', status: 'todo', priority: 'medium', project: project1._id, reporter: managerUser._id },
      { title: 'Mobile responsiveness audit', status: 'review', priority: 'high', project: project1._id, assignee: memberUser2._id, reporter: managerUser._id },
      { title: 'Performance optimization - reduce load time', status: 'todo', priority: 'medium', project: project1._id, reporter: adminUser._id },
      { title: 'SEO meta tags implementation', status: 'done', priority: 'low', project: project1._id, assignee: memberUser2._id, reporter: managerUser._id },
      // Project 2 tasks
      { title: 'Set up React Native project', status: 'done', priority: 'high', project: project2._id, assignee: memberUser1._id, reporter: adminUser._id },
      { title: 'Design app navigation structure', status: 'in_progress', priority: 'medium', project: project2._id, reporter: adminUser._id },
      { title: 'Implement push notifications', status: 'todo', priority: 'medium', project: project2._id, assignee: memberUser1._id, reporter: adminUser._id },
      // Project 3 tasks
      { title: 'Set up data pipeline', status: 'done', priority: 'urgent', project: project3._id, assignee: memberUser1._id, reporter: memberUser1._id },
      { title: 'Build chart components', status: 'in_progress', priority: 'high', project: project3._id, reporter: memberUser1._id },
      { title: 'Real-time data WebSocket integration', status: 'todo', priority: 'high', project: project3._id, assignee: memberUser1._id, reporter: memberUser1._id },
    ];

    for (let i = 0; i < taskData.length; i++) {
      await Task.create({ ...taskData[i], position: i });
    }
    console.log(`✅ Created ${taskData.length} tasks`);

    // ── Create Payments ────────────────────────────────────────────────────────
    await Payment.create({
      user: managerUser._id,
      amount: 29,
      currency: 'USD',
      status: 'completed',
      plan: 'pro',
      transactionId: generateTransactionId(),
      description: 'Pro plan subscription',
    });

    await Payment.create({
      user: memberUser1._id,
      amount: 9,
      currency: 'USD',
      status: 'completed',
      plan: 'starter',
      transactionId: generateTransactionId(),
      description: 'Starter plan subscription',
    });

    console.log('💳 Created payments');

    // ── Create Activities ───────────────────────────────────────────────────────
    await Activity.create({ user: adminUser._id, action: 'registered', resource: 'user', resourceId: adminUser._id.toString() });
    await Activity.create({ user: managerUser._id, action: 'created_project', resource: 'project', resourceId: project1._id.toString(), details: { projectName: project1.name } });
    await Activity.create({ user: memberUser1._id, action: 'created_task', resource: 'task', resourceId: 'task1', details: { taskTitle: 'Design wireframes' } });
    console.log('📊 Created activity logs');

    // ── Create Notifications ─────────────────────────────────────────────────
    await Notification.create({
      user: managerUser._id,
      title: 'Welcome to ProjectFlow!',
      message: 'Your account is ready. Start creating projects and managing your team.',
      type: 'success',
    });
    await Notification.create({
      user: memberUser1._id,
      title: 'New task assigned',
      message: 'You have been assigned to: "Implement product listing page"',
      type: 'info',
    });
    console.log('🔔 Created notifications');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login credentials:');
    console.log('  Admin:   admin@projectflow.com    / admin123');
    console.log('  Manager: sarah@projectflow.com    / password123');
    console.log('  Member:  alex@projectflow.com     / password123');
    console.log('  Member:  maria@projectflow.com    / password123');
    console.log('  Guest:   guest@projectflow.com    / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
