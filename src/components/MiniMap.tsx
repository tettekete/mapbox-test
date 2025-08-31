/**
 * mapbox-gl を用いた地図表示のミニマム版
 */

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MiniMap()
{
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() =>
	{
		const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
		if (!token) throw new Error("VITE_MAPBOX_TOKEN is missing");

		mapboxgl.accessToken = token;

		console.log("supported", mapboxgl.supported());

		const map = new mapboxgl.Map(
		{
			container: ref.current!,
			style: "mapbox://styles/mapbox/light-v11",
			center: [140.8719, 38.2682],
			zoom: 8,
			attributionControl: true,
		});

		map.once("load", () =>
		{
			console.log("map load: OK");
		});

		map.on("error", (e) =>
		{
			console.error("map error:", e?.error || e);
		});

		return () => map.remove();
	}, []);

	// 重要: ここで高さを明示
	return <div ref={ref} style={{ width: "100%", height: "80vh" }} />;
}