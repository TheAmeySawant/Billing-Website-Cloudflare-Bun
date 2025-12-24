import { useEffect , useState} from "react"


export const DashboardCall = () => {

    const [status, setStatus] = useState('')

    useEffect(() => {
        fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => setStatus(data))
    }, [])

    return (
        <div>
            <h1>{status}</h1>
        </div>
    )
}