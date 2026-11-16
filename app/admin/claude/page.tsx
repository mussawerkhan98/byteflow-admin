import { redirect } from 'next/navigation'
import { isAdministrator } from '../../lib/auth'
import ClaudeConnector from './ClaudeConnector'

export default async function ClaudePage() {
  if (!(await isAdministrator())) redirect('/admin')
  return <ClaudeConnector />
}
