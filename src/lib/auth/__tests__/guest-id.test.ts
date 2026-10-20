import { beforeEach, describe, expect, it } from "vitest";

import {
  clearGuestId,
  getGuestId,
  GUEST_ID_STORAGE_KEY,
  isValidUuid,
  setGuestId,
} from "../guest-id";

describe("GuestId (src/lib/auth/guest-id.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearGuestId();
  });

  it("deve gerar um UUID v4 canônico válido na primeira chamada quando não houver ID persistido", () => {
    const guestId = getGuestId();

    expect(isValidUuid(guestId)).toBe(true);
    expect(localStorage.getItem(GUEST_ID_STORAGE_KEY)).toBe(guestId);
  });

  it("deve retornar o mesmo guestId em chamadas subsequentes (idempotente)", () => {
    const firstId = getGuestId();
    const secondId = getGuestId();
    const thirdId = getGuestId();

    expect(secondId).toBe(firstId);
    expect(thirdId).toBe(firstId);
  });

  it("deve regenerar um novo UUID caso o valor persistido no storage esteja corrompido ou inválido", () => {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, "invalid-not-a-uuid-1234");

    const newId = getGuestId();
    expect(isValidUuid(newId)).toBe(true);
    expect(newId).not.toBe("invalid-not-a-uuid-1234");
    expect(localStorage.getItem(GUEST_ID_STORAGE_KEY)).toBe(newId);
  });

  it("deve permitir definir um guestId manualmente quando for um UUID v4 válido", () => {
    const customUuid = "e0b1c9c4-1234-4567-89ab-cdef01234567";
    setGuestId(customUuid);

    expect(getGuestId()).toBe(customUuid);
  });

  it("deve rejeitar setGuestId com strings que não sejam UUID v4", () => {
    expect(() => setGuestId("invalid-format")).toThrow();
    expect(() => setGuestId("")).toThrow();
  });

  it("deve remover o guestId ao invocar clearGuestId()", () => {
    const id1 = getGuestId();
    expect(localStorage.getItem(GUEST_ID_STORAGE_KEY)).toBe(id1);

    clearGuestId();
    expect(localStorage.getItem(GUEST_ID_STORAGE_KEY)).toBeNull();

    const id2 = getGuestId();
    expect(isValidUuid(id2)).toBe(true);
    expect(id2).not.toBe(id1);
  });
});
