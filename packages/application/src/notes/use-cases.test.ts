import {
	createNote,
	deleteNote,
	parseNoteInput,
	type CreateNoteDeps,
} from "@s-hirano-ist/s-application/notes/use-cases";
import { makeNoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import {
	makeId,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { describe, expect, test, vi } from "vite-plus/test";

function dependencies() {
	const ensureNoDuplicate = vi.fn().mockResolvedValue(undefined);
	const create = vi
		.fn<CreateNoteDeps["commandRepository"]["create"]>()
		.mockResolvedValue(undefined);
	const deleteById = vi
		.fn<CreateNoteDeps["commandRepository"]["deleteById"]>()
		.mockResolvedValue({ title: makeNoteTitle("Title") });
	const dispatch = vi
		.fn<CreateNoteDeps["eventDispatcher"]["dispatch"]>()
		.mockResolvedValue(undefined);
	const deps: CreateNoteDeps = {
		commandRepository: { create, deleteById },
		eventDispatcher: { dispatch },
		domainServiceFactory: {
			createNotesDomainService: () => ({ ensureNoDuplicate }),
		},
	};
	return { deps, ensureNoDuplicate, create, deleteById, dispatch };
}
describe("Backend note use cases", () => {
	test("validates and persists the authenticated owner's note", async () => {
		const fixture = dependencies();
		const owner = makeUserId("alice");
		const input = parseNoteInput({ title: "Title", markdown: "# Body" }, owner);
		const result = await createNote(input, fixture.deps);
		expect(fixture.ensureNoDuplicate).toHaveBeenCalledWith(input.title, owner);
		expect(fixture.create).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ ...input, id: result.id }),
		);
		expect(fixture.dispatch).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				metadata: expect.objectContaining({ userId: owner }),
			}),
		);
		expect(() =>
			parseNoteInput({ title: "", markdown: "Body" }, owner),
		).toThrow(Error);
	});
	test("preserves a duplicate error without writes or events", async () => {
		const fixture = dependencies();
		fixture.ensureNoDuplicate.mockRejectedValue(new DuplicateError());
		await expect(
			createNote(
				parseNoteInput(
					{ title: "Title", markdown: "Body" },
					makeUserId("alice"),
				),
				fixture.deps,
			),
		).rejects.toBeInstanceOf(DuplicateError);
		expect(fixture.create).not.toHaveBeenCalled();
		expect(fixture.dispatch).not.toHaveBeenCalled();
	});
	test("deletes only unexported notes for the explicit owner", async () => {
		const fixture = dependencies();
		const id = makeId();
		const owner = makeUserId("alice");
		await deleteNote(id, owner, fixture.deps);
		expect(fixture.deleteById).toHaveBeenCalledWith(
			id,
			owner,
			makeUnexportedStatus(),
		);
		expect(fixture.dispatch).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				metadata: expect.objectContaining({ userId: owner }),
			}),
		);
	});
});
