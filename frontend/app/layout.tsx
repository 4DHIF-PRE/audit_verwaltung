import {Navbar} from "~/components/Navbar";
import {Footer} from "~/components/Footer";

export function BaseLayout({ children }: { children: React.ReactNode }) {
    return (
     <div>
         <Navbar/>
         {children}
         <Footer/>
     </div>
    );
}
