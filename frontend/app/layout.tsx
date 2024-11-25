import {Navbar} from "~/components/Navbar";


export function BaseLayout({ children }: { children: React.ReactNode }) {
    return (
     <div>
         <Navbar/>
         {children}
     </div>
    );
}
