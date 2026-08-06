import { redirect } from 'next/navigation'
import { isAdministrator } from '../../lib/auth'
import UsersManager from './UsersManager'
export default async function UsersPage(){if(!(await isAdministrator()))redirect('/admin');return <UsersManager/>}
