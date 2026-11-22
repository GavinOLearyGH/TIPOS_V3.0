// Refresh an existing parent-site worker; do not install a second game worker.
// Release imports stay immutable while that update takes effect.
export async function refreshParentWorker(){
    if(!globalThis.navigator?.serviceWorker?.getRegistrations)return;
    try{
        const registrations=await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations.filter(reg=>location.href.startsWith(reg.scope)).map(reg=>reg.update()));
    }catch{/* A worker update must not block a hole or offline play. */}
}
