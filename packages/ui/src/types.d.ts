declare module "*.css";

declare module "lucide-react/dist/esm/icons/*.mjs" {
	import type {
		ForwardRefExoticComponent,
		RefAttributes,
		SVGProps,
	} from "react";

	type LucideIconProps = SVGProps<SVGSVGElement> & { size?: number | string };
	const Icon: ForwardRefExoticComponent<
		Omit<LucideIconProps, "ref"> & RefAttributes<SVGSVGElement>
	>;
	export default Icon;
}
