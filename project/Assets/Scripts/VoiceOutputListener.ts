import { ASRQueryController } from "./ASRQueryController";

@component
export class VoiceOutputListener extends BaseScriptComponent {
  @input
  private asrQueryController: ASRQueryController;

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.init.bind(this));
  }

  private init() {
    // Listen to voice query events and print the output
    this.asrQueryController.onQueryEvent.add((query) => {
      print("Voice input received: " + query);
    });
  }
}