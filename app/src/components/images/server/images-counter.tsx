import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	count: number;
};

export function ImagesCounter({ count }: Props) {
	return <CounterBadge label="totalImages" totalItems={count} />;
}
