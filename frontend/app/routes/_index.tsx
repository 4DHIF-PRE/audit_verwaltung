import type { MetaFunction } from "@remix-run/node";
import { BaseLayout } from "~/layout";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {

  function rufeAdminDingsAuf() {
    console.log("TAg");
  }


  return (
    <BaseLayout>
      <div className="flex flex-col gap-4">
        <Label>Test</Label>
        <Button className="w-52" onClick={rufeAdminDingsAuf}>
          AdminRegisterTokenErstellung
        </Button>
      </div>
    </BaseLayout>
  );
}

