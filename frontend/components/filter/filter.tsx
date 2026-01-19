import Image from "next/image";
import SmallArrow from "@/public/icons/small-arrow.svg"

export default function Filter() {
    return (
        <div className="flex items-center justify-between py-5 border-b border-separator -mx-4">
            <p className="text-gray-text ml-4">2879 questions</p>
            <div className="flex gap-2 mr-4">
                <p className="text-gray-text">Filter</p>
                <Image src={SmallArrow} alt="Small Arrow" className="mt-[2px] w-[5px]"/>
            </div>
        </div>
    );
}