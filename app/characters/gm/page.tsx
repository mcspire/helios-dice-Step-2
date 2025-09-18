import { CharacterList } from "@helios/ui/character-list";
import { CharacterSheet } from "@helios/ui/character-sheet";
import { getCharacters } from "@helios/utils/server";
import { updateCharacterAction } from "../actions/update-character";

export default async function CharactersGmPage() {
  const characters = await getCharacters();

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
      <CharacterList characters={characters} showRoles />
      <CharacterSheet mode="gm" onUpdate={updateCharacterAction} />
    </div>
  );
}
