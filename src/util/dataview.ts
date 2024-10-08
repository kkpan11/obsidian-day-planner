import { Moment } from "moment/moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { DataArray, DateTime, STask } from "obsidian-dataview";

import {
  defaultDayFormat,
  defaultDayFormatForLuxon,
  defaultDurationMinutes,
  indentBeforeTaskParagraph,
} from "../constants";
import { getTimeFromSTask } from "../parser/parser";
import { timeFromStartRegExp } from "../regexp";
import { Task, TaskTokens } from "../types";

import { ClockMoments, toTime } from "./clock";
import { getId } from "./id";
import { getMinutesSinceMidnight } from "./moment";
import { deleteProps } from "./properties";

export function unwrap<T>(group: ReturnType<DataArray<T>["groupBy"]>) {
  return group.map(({ key, rows }) => [key, rows.array()]).array();
}

interface Node {
  text: string;
  symbol: string;
  children: Node[];
  status?: string;
  scheduled?: DateTime;
}

export function textToString(node: Node) {
  const status = node.status ? `[${node.status}] ` : "";
  return `${node.symbol} ${status}${deleteProps(node.text)}\n`;
}

// todo: remove duplication: toMarkdown
export function toString(node: Node, indentation = "") {
  let result = `${indentation}${textToString(node)}`;

  for (const child of node.children) {
    if (!child.scheduled && !timeFromStartRegExp.test(child.text)) {
      // todo (minor): handle custom indentation (spaces of differing lengths)
      result += toString(child, `\t${indentation}`);
    }
  }

  return result;
}

export function toUnscheduledTask(sTask: STask, day: Moment) {
  return {
    durationMinutes: defaultDurationMinutes,
    symbol: sTask.symbol,
    status: sTask.status,
    text: toString(sTask),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function toTask(sTask: STask, day: Moment): Task {
  const { startTime, durationMinutes } = getTimeFromSTask({
    line: sTask.text,
    day,
  });

  return {
    startTime,
    symbol: sTask.symbol,
    status: sTask.status,
    text: toString(sTask),
    durationMinutes,
    // todo: delete
    startMinutes: getMinutesSinceMidnight(startTime),
    location: {
      path: sTask.path,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function getScheduledDay(sTask: STask) {
  const scheduledPropDay: string = sTask.scheduled?.toFormat?.(
    defaultDayFormatForLuxon,
  );
  const dailyNoteDay = getDateFromPath(sTask.path, "day")?.format(
    defaultDayFormat,
  );

  return scheduledPropDay || dailyNoteDay;
}

export function toClockRecord(sTask: STask, clockMoments: ClockMoments) {
  // TODO: remove duplication
  return {
    ...toTime(clockMoments),
    startTime: clockMoments[0],
    text: toString(sTask),
    symbol: "-",
    location: {
      path: sTask.path,
      position: sTask.position,
    },
    id: getId(),
  };
}

export function toMarkdown(sTask: STask) {
  const baseIndent = "\t".repeat(sTask.position.start.col);
  const extraIndent = " ".repeat(indentBeforeTaskParagraph);

  return sTask.text
    .split("\n")
    .map((line, i) => {
      if (i === 0) {
        // TODO: remove duplication
        return `${baseIndent}${getListTokens(sTask)} ${line}`;
      }

      return `${baseIndent}${extraIndent}${line}`;
    })
    .join("\n");
}

export function getListTokens(task: TaskTokens) {
  const maybeCheckbox = task.status === undefined ? "" : `[${task.status}]`;
  return `${task.symbol} ${maybeCheckbox}`.trim();
}

export function replaceSTaskInFile(
  contents: string,
  sTask: STask,
  newText: string,
) {
  const lines = contents.split("\n");
  // todo: this is not going to work: it doesn't consider sub-task lines
  const deleteCount = sTask.position.end.line - sTask.position.start.line + 1;

  lines.splice(sTask.position.start.line, deleteCount, newText);

  return lines.join("\n");
}
