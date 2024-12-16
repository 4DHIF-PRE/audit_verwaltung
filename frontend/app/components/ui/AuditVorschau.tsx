import {useEffect, useState} from "react";


interface Props {
    audit: number
}


export default function AuditVorschau({ audit }: Props) {
    const [anzeige, setAnzeige] = useState("");
    useEffect(() => {
        if(audit==0)
        {
            setAnzeige("Select Audit");
        }
        else{
            setAnzeige(`Audit ${audit}`)
        }
    },[audit])


    return (
        <div
            className="flex-1 ml-6 bg-gray-200 flex items-center justify-center"
            style={{backgroundColor: "#dcdcdc"}}
        >
            <span className="text-xl" style={{color: "#666"}}>
              {anzeige}
            </span>
        </div>
    );
}