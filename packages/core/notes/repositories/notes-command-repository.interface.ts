import type { Id, Status, UserId } from "../../common/entities/common-entity";
import type { UnexportedNote } from "../entities/note-entity";

export type INotesCommandRepository = {
	create(data: UnexportedNote): Promise<void>;
	deleteById(id: Id, userId: UserId, status: Status): Promise<void>;
};
