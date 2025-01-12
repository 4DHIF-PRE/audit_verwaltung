import {MetaFunction, redirect} from "@remix-run/node";
import {BaseLayout} from "~/layout";
import {Label} from "~/components/ui/label";
import {Button} from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";


export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async () => {
    return redirect("/auditPage");
};

export default function Index() {


    
  return (
      <BaseLayout>
          <div className="flex flex-col gap-4">
          </div>
      </BaseLayout>
  );
}

