import type { DeliveryDetails } from "../../src/features/checkout/types/checkoutTypes.ts";
import { CommerceError, type Coordinates, type DeliveryRadius } from "./config.ts";

interface AddressResult {
  partial_match?: boolean;
  types?: string[];
  address_components?: { types: string[]; short_name: string }[];
  geometry?: { location_type: string; location?: { lat: number; lng: number } };
}

const toRadians = (degrees: number) => degrees * Math.PI / 180;

export function distanceMetres(from: Coordinates, to: Coordinates) {
  const haversine = Math.sin(toRadians(to.latitude - from.latitude) / 2) ** 2
    + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude))
      * Math.sin(toRadians(to.longitude - from.longitude) / 2) ** 2;
  return 2 * 6_371_008.8 * Math.asin(Math.sqrt(Math.min(haversine, 1)));
}

function addressCoordinates(result: AddressResult, pin: string): Coordinates | null {
  const geometry = result.geometry;
  const component = (type: string) =>
    result.address_components?.find((value) => value.types.includes(type))?.short_name;

  if (result.partial_match || !geometry?.location
    || !["ROOFTOP", "RANGE_INTERPOLATED"].includes(geometry.location_type)
    || !result.types?.some((type) => ["street_address", "premise", "subpremise"].includes(type))
    || component("country") !== "IN" || component("postal_code") !== pin) return null;

  const { lat, lng } = geometry.location;
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

export async function verifyDeliveryRadius(config: DeliveryRadius, details: DeliveryDetails) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.search = new URLSearchParams({
    address: `${details.address}, ${details.city}`,
    components: `country:IN|postal_code:${details.postalCode}`,
    key: config.geocodingKey,
  }).toString();

  const unavailable = () => new CommerceError(503, "Address verification is temporarily unavailable. Please try again.");
  let data: { status: string; results: AddressResult[] };
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6_000), redirect: "error" });
    if (!response.ok) throw unavailable();
    data = await response.json();
  } catch {
    throw unavailable();
  }
  if (data.status !== "ZERO_RESULTS" && (data.status !== "OK" || !Array.isArray(data.results))) throw unavailable();

  const matches = data.status === "OK"
    ? data.results.map((result) => addressCoordinates(result, details.postalCode)).filter((point) => point !== null)
    : [];
  if (matches.length !== 1)
    throw new CommerceError(422, "We couldn’t verify this address. Enter the house or building number, street and locality, then try again.");

  if (distanceMetres(config.kitchen, matches[0]) >= config.metres)
    throw new CommerceError(422, `This address is outside our delivery area. We deliver under ${config.metres / 1_000} km from the kitchen.`);
}
