export const createLocationSlug=(city,state)=>{
    if(!city || !state) return ""

    const citySlug=city.toLowerCase().replace(/\s+/g,"-")
    const stateSlug=state.toLowerCase().replace(/\s+/g,"-")

    return `${citySlug}-${stateSlug}`
}