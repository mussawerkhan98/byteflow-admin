import { notFound, redirect } from 'next/navigation'
import { isAdminAuthenticated } from '../../lib/auth'
import { getResource } from '../../lib/cms-config'
import ResourceManager from './ResourceManager'

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')
  const { resource } = await params
  const config = getResource(resource)
  if (!config) notFound()
  return <ResourceManager resourceKey={resource} config={config} />
}
