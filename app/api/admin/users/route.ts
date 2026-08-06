import { db } from '../../../lib/db'
import { hashAdminPassword, isAdministrator } from '../../../lib/auth'

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
function validate(body:Record<string,unknown>, editing=false){
  const displayName=String(body.display_name??'').trim(),email=String(body.email??'').trim().toLowerCase(),password=String(body.password??''),role=body.role==='administrator'?'administrator':'editor',active=body.active===false||body.active===0?0:1
  if(displayName.length<2||displayName.length>100)throw new Error('Display name must be between 2 and 100 characters')
  if(!emailPattern.test(email))throw new Error('Enter a valid email address')
  if((!editing||password)&&password.length<8)throw new Error('Password must contain at least 8 characters')
  return{displayName,email,password,role,active}
}
function failure(error:unknown){const message=error instanceof Error?error.message:'Unexpected error';return Response.json({error:/UNIQUE constraint/i.test(message)?'A user with this email already exists.':message},{status:400})}

export async function GET(){if(!(await isAdministrator()))return Response.json({error:'Administrator access required'},{status:403});const result=await db.execute('SELECT id,display_name,email,role,active,created_at,updated_at FROM admin_users ORDER BY display_name');return Response.json({users:result.rows})}
export async function POST(request:Request){if(!(await isAdministrator()))return Response.json({error:'Administrator access required'},{status:403});try{const data=validate(await request.json() as Record<string,unknown>);const result=await db.execute({sql:'INSERT INTO admin_users (display_name,email,password_hash,role,active) VALUES (?,?,?,?,?)',args:[data.displayName,data.email,hashAdminPassword(data.password),data.role,data.active]});return Response.json({id:Number(result.lastInsertRowid)},{status:201})}catch(error){return failure(error)}}
export async function PUT(request:Request){if(!(await isAdministrator()))return Response.json({error:'Administrator access required'},{status:403});try{const body=await request.json() as Record<string,unknown>,id=Number(body.id);if(!id)throw new Error('Valid user ID required');const data=validate(body,true);if(data.password)await db.execute({sql:"UPDATE admin_users SET display_name=?,email=?,password_hash=?,role=?,active=?,updated_at=datetime('now') WHERE id=?",args:[data.displayName,data.email,hashAdminPassword(data.password),data.role,data.active,id]});else await db.execute({sql:"UPDATE admin_users SET display_name=?,email=?,role=?,active=?,updated_at=datetime('now') WHERE id=?",args:[data.displayName,data.email,data.role,data.active,id]});return Response.json({ok:true})}catch(error){return failure(error)}}
export async function DELETE(request:Request){if(!(await isAdministrator()))return Response.json({error:'Administrator access required'},{status:403});const id=Number(new URL(request.url).searchParams.get('id'));if(!id)return Response.json({error:'Valid user ID required'},{status:400});await db.execute({sql:'DELETE FROM admin_users WHERE id=?',args:[id]});return Response.json({ok:true})}
