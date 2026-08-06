import { isAdminAuthenticated } from '../../../../lib/auth'
import { db } from '../../../../lib/db'

type Item={id:number;parent_id:number|null;sort_order:number;area:'header'|'footer'}
export async function POST(request:Request){
  if(!(await isAdminAuthenticated()))return Response.json({error:'Unauthorized'},{status:401})
  const body=await request.json().catch(()=>null) as {items?:Item[]}|null
  if(!Array.isArray(body?.items)||body.items.length>200)return Response.json({error:'Invalid menu order'},{status:400})
  const ids=new Set(body.items.map(item=>Number(item.id)))
  for(const item of body.items){if(!Number.isInteger(item.id)||item.id<=0||!['header','footer'].includes(item.area)||item.parent_id===item.id||(item.parent_id!==null&&!ids.has(Number(item.parent_id))))return Response.json({error:'Invalid menu hierarchy'},{status:400})}
  const parents=new Map(body.items.map(item=>[item.id,item.parent_id]))
  for(const item of body.items){const seen=new Set<number>([item.id]);let parent=item.parent_id;while(parent!==null){if(seen.has(parent))return Response.json({error:'A menu item cannot be nested inside its own child'},{status:400});seen.add(parent);parent=parents.get(parent)??null}}
  await db.batch(body.items.map((item,index)=>({sql:"UPDATE menu_items SET parent_id=?,sort_order=?,area=?,updated_at=datetime('now') WHERE id=?",args:[item.parent_id,index*10,item.area,item.id]})),'write')
  return Response.json({ok:true})
}
