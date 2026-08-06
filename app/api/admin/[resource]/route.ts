import { isAdminAuthenticated, isAdministrator } from '../../../lib/auth'
import { createRecord, deleteRecord, listRecords, reorderRecord, updateRecord } from '../../../lib/cms-admin'
import { getResource } from '../../../lib/cms-config'

function errorResponse(error: unknown) {
  const technical = error instanceof Error ? error.message : ''
  if (/FOREIGN KEY constraint failed/i.test(technical)) return Response.json({ error: 'Please choose a valid related page or parent item.' }, { status: 400 })
  if (/UNIQUE constraint/i.test(technical)) return Response.json({ error: 'That value already exists. Please use a different one.' }, { status: 409 })
  if (/required|must be|invalid|cannot be|between 1 and 5|lowercase letters/i.test(technical)) return Response.json({ error: technical }, { status: 400 })
  return Response.json({ error: 'We could not complete that action. Check the form and try again.' }, { status: 400 })
}

async function canAccess(resourceKey: string) {
  return resourceKey === 'scripts' ? isAdministrator() : isAdminAuthenticated()
}

type Context = { params: Promise<{ resource: string }> }
export async function GET(_request: Request, context: Context) {
  const resourceKey = (await context.params).resource
  if (!(await canAccess(resourceKey))) return Response.json({ error: 'You do not have permission to manage this section.' }, { status: 403 })
  const resource = getResource(resourceKey)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try { return Response.json({ records: await listRecords(resource) }) } catch (error) { return errorResponse(error) }
}

export async function POST(request: Request, context: Context) {
  const resourceKey = (await context.params).resource
  if (!(await canAccess(resourceKey))) return Response.json({ error: 'You do not have permission to manage this section.' }, { status: 403 })
  const resource = getResource(resourceKey)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try {
    const body = await request.json() as Record<string, unknown>
    if (body.action === 'reorder') { await reorderRecord(resource, Number(body.id), body.direction === 'down' ? 'down' : 'up'); return Response.json({ ok: true }) }
    return Response.json(await createRecord(resource, body), { status: 201 })
  } catch (error) { return errorResponse(error) }
}

export async function PUT(request: Request, context: Context) {
  const resourceKey = (await context.params).resource
  if (!(await canAccess(resourceKey))) return Response.json({ error: 'You do not have permission to manage this section.' }, { status: 403 })
  const resource = getResource(resourceKey)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try { const body = await request.json() as Record<string, unknown>; await updateRecord(resource, Number(body.id), body); return Response.json({ ok: true }) } catch (error) { return errorResponse(error) }
}

export async function DELETE(request: Request, context: Context) {
  const resourceKey = (await context.params).resource
  if (!(await canAccess(resourceKey))) return Response.json({ error: 'You do not have permission to manage this section.' }, { status: 403 })
  const resource = getResource(resourceKey)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try { const id = Number(new URL(request.url).searchParams.get('id')); if (!id) throw new Error('A valid id is required'); await deleteRecord(resource, id); return Response.json({ ok: true }) } catch (error) { return errorResponse(error) }
}
