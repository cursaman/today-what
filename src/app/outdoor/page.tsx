import { createClient } from "@/lib/supabase/server";
import OutdoorExplorer from "./OutdoorExplorer";
export const dynamic = "force-dynamic";
export default async function OutdoorPage(){
  const supabase=await createClient(); let initialRegion="부산"; let personalized=false;
  if(supabase){const {data:{user}}=await supabase.auth.getUser();if(user){const {data}=await supabase.from("user_preferences").select("default_region").eq("user_id",user.id).maybeSingle();if(typeof data?.default_region==="string"){initialRegion=data.default_region;personalized=true;}}}
  return <OutdoorExplorer initialRegion={initialRegion} personalized={personalized}/>;
}
