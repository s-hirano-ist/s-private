import type {
	Id,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import type { Note } from "../entities/note-entity";

export type INotesCommandRepository = {
	create(data: Note): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
