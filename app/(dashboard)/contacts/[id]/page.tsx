import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import ViewContact from "../view-contact";

export default async function ViewContactsPage() {

    return (
        <main className="p-8">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        {/* <BreadcrumbLink asChild> */}
                        <Link className="underline text-light-text-secondary" href="/">
                            Home
                        </Link>
                        {/* </BreadcrumbLink> */}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        {/* <BreadcrumbLink className="text-light-text-secondary"> */}
                        <Link className="underline text-light-text-secondary" href="/contacts">
                            Contact
                        </Link>
                        {/* </BreadcrumbLink> */}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="text-light-text-secondary">Contact View</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="py-10">
                <ViewContact />
            </div>
        </main>
    );
}
