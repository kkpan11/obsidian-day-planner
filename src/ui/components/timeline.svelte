<script lang="ts">
  import TimeScale from "./time-scale.svelte";
  import Needle from "./needle.svelte";
  import TaskContainer from "./task-container.svelte";
  import Controls from "./controls.svelte";
  import { hourSize, startHour } from "../../timeline-store";

  let userHoversOverScroller = false;

  $: visibleHours = Array.from({ length: 24 })
    .map((value, index) => index)
    .slice($startHour);
</script>

<Controls />
<div
  class="scroller"
  on:mouseenter={() => {
    userHoversOverScroller = true
  }}
  on:mouseleave={() => {
    userHoversOverScroller = false
  }}
>
  <div class="time-grid">
    <TimeScale {visibleHours} />
    <div class="task-grid">
      <div class="absolute-stretch-x">
        <Needle scrollBlockedByUser={userHoversOverScroller} />
        <TaskContainer />
      </div>
      {#each visibleHours as hour}
        <div class="time-grid-block" style:height="{$hourSize}px"></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .scroller {
    height: 100%;
    overflow: auto;
  }

  .time-grid {
    display: flex;
  }

  .task-grid {
    position: relative;
    flex: 1 0 0;
  }

  .time-grid-block {
    border-left: 1px solid var(--background-modifier-border);
    flex-grow: 1;
    flex-shrink: 0;
  }

  /* TODO: this selector is a lame workaround for task container which is absolutely positioned*/
  .time-grid-block:not(:nth-child(2)) {
    border-top: 1px solid var(--background-modifier-border);
  }
</style>