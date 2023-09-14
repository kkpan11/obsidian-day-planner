import type { Moment } from "moment/moment";
import type { Workspace } from "obsidian";
import { MarkdownView, MetadataCache, TFile, Vault } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDateFromFile,
} from "obsidian-daily-notes-interface";
import { isNotVoid } from "typed-assert";

import { parsePlanItems } from "../parser/parser";
import type { DayPlannerSettings } from "../settings";

export class ObsidianFacade {
  constructor(
    private readonly workspace: Workspace,
    private readonly vault: Vault,
    private readonly metadataCache: MetadataCache,
    private readonly settings: DayPlannerSettings,
  ) {}

  async openFileInEditor(file: TFile) {
    const leaf = this.workspace.getLeaf(false);

    await leaf.openFile(file);

    return this.workspace.activeEditor?.editor;
  }

  async openFileForDay(moment: Moment) {
    const dailyNote =
      getDailyNote(moment, getAllDailyNotes()) ||
      (await createDailyNote(moment));

    return this.openFileInEditor(dailyNote);
  }

  getFileByPath(path: string) {
    const file = this.vault.getAbstractFileByPath(path);

    if (!(file instanceof TFile)) {
      throw new Error(`Unable to open file: ${path}`);
    }

    return file;
  }

  async revealLineInFile(path: string, line: number) {
    const file = this.getFileByPath(path);

    const editor = await this.openFileInEditor(file);

    this.workspace
      .getActiveViewOfType(MarkdownView)
      ?.setEphemeralState({ line });

    editor.setCursor({ line, ch: 0 });
  }

  // todo: rename to calculateOverlap
  async getPlanItemsFromFile(file: TFile) {
    if (!file) {
      return [];
    }

    const { plannerHeading } = this.settings;

    const fileContents = await this.vault.cachedRead(file);
    const metadata = this.metadataCache.getFileCache(file);

    const fileDay = getDateFromFile(file, "day");

    isNotVoid(
      fileDay,
      `Tried to parse plan in file that is not a daily note: ${file.path}`,
    );

    return parsePlanItems(
      fileContents,
      metadata,
      plannerHeading,
      file.path,
      fileDay,
    );
  }
}
