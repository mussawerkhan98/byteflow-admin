import { isAdminAuthenticated } from '../../../lib/auth'
import { createRecord, deleteRecord, listRecords, reorderRecord, updateRecord } from '../../../lib/cms-admin'
import { getResource } from '../../../lib/cms-config'

function errorResponse(error: unknown) {
  let message = error instanceof Error ? error.message : 'Unexpected error'
  if (/FOREIGN KEY constraint failed/i.test(message)) message = 'The selected related record does not exist. Use a valid Page ID or Parent ID, or leave an optional relationship blank.'
  const status = /UNIQUE constraint/i.test(message) ? 409 : 400
  return Response.json({ error: message.replace(/^.*UNIQUE constraint failed:\s*/i, 'A record with this unique value already exists: ') }, { status })
}

type Context = { params: Promise<{ resource: string }> }
export async function GET(_request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const resource = getResource((await context.params).resource)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try { return Response.json({ records: await listRecords(resource) }) } catch (error) { return errorResponse(error) }
}

export async function POST(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const resource = getResource((await context.params).resource)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try {
    const body = await request.json() as Record<string, unknown>
    if (body.action === 'reorder') { await reorderRecord(resource, Number(body.id), body.direction === 'down' ? 'down' : 'up'); return Response.json({ ok: true }) }
    return Response.json(await createRecord(resource, body), { status: 201 })
  } catch (error) { return errorResponse(error) }
}

export async function PUT(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const resource = getResource((await context.params).resource)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try { const body = await request.json() as Record<string, unknown>; await updateRecord(resource, Number(body.id), body); return Response.json({ ok: true }) } catch (error) { return errorResponse(error) }
}

export async function DELETE(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const resource = getResource((await context.params).resource)
  if (!resource) return Response.json({ error: 'Unknown resource' }, { status: 404 })
  try { const id = Number(new URL(request.url).searchParams.get('id')); if (!id) throw new Error('A valid id is required'); await deleteRecord(resource, id); return Response.json({ ok: true }) } catch (error) { return errorResponse(error) }
}
