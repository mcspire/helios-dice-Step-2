import { redirect } from "next/navigation";
import { CharacterList } from "@helios/ui/character-list";
import { CharacterSheet } from "@helios/ui/character-sheet";
import { getCharacters, UnauthorizedError } from "@helios/utils/server";
import { updateCharacterAction } from "../actions/update-character";

export default async function CharactersGmPage() {
  try {
    const characters = await getCharacters();

    return (
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <CharacterSheet mode="gm" onUpdate={updateCharacterAction} />
        <CharacterList characters={characters} />
      </div>
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }
}
