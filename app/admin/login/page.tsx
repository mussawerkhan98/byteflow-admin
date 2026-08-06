import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '../../lib/auth'
import LoginForm from './LoginForm'
export default async function LoginPage() { if (await isAdminAuthenticated()) redirect('/admin'); return <div className="flex min-h-[80vh] items-center justify-center px-4"><LoginForm /></div> }
