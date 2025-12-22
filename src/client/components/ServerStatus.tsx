import { useEffect , useState} from "react"


export const ServerStatus = () => {

    const [status, setStatus] = useState('')

    useEffect(() => {
        fetch('/api/health')
        .then(res => res.json())
        .then(data => setStatus(data))
    }, [])

    return (
        <div>
            <h1>Server Status</h1>
            <p>{status}</p>
        </div>
    )
}