import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from '@mapbox/mapbox-gl-language';
	// 地名の日本語化モジュール。サポートしているのは Mapbox v8 style ベースのマップのみ
	// → https://www.npmjs.com/package/@mapbox/mapbox-gl-language#supported-styles
import "mapbox-gl/dist/mapbox-gl.css";
import { restoreShuffledToken } from '../lib/obfuscation';

mapboxgl.accessToken = restoreShuffledToken(
	import.meta.env.VITE_MAPBOX_TOKEN_SHUF || "YOUR_MAPBOX_ACCESS_TOKEN",
	'map+box@test'.replace( /\W/g,'' )
);

type ValidLayerID = 'tsunami' | 'dia' |'heart' | 'star';
type LayersVisibilityT = {[key in ValidLayerID]: boolean }


export default function MultiLayerMap()
{
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);

	// 表示/非表示をスイッチできるように状態化
	const [layers, setLayers] = useState<LayersVisibilityT>({
		tsunami: true, // 津波レイヤーは初期ON
		dia: false,
		heart: false,
		star: false,
	});

	useEffect(() =>
	{
		if( !containerRef.current ) return;

		const map = new mapboxgl.Map({
			container: containerRef.current,
			style: "mapbox://styles/mapbox/streets-v11",
			center: [140.872, 38.268],
			zoom: 10,
		});

		// 日本語化
		map.addControl(new MapboxLanguage({ defaultLanguage: 'ja' }));
			
		mapRef.current = map;

		map.on("load", async () =>
		{
			// --- 津波ハザード（GSI ラスタ） ---
			if( !map.getSource("tsunami") )
			{
				map.addSource("tsunami", {
					type: "raster",
					tiles: [
						"https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png",
					],
					tileSize: 256,
					minzoom: 2,
					maxzoom: 17,
					bounds: [122, 20, 154, 46],
				});
			}
			if( !map.getLayer("tsunami") )
			{
				map.addLayer({
					id: "tsunami",
					type: "raster",
					source: "tsunami",
					paint: { "raster-opacity": 0.6 },
				});
			}
			// 初期可視状態を反映
			map.setLayoutProperty("tsunami", "visibility", layers.tsunami ? "visible" : "none");

			// --- 共通関数: GeoJSON 読み込み & レイヤ追加（塗り/線/ラベル） ---
			async function addGeoLayer(id: ValidLayerID, url: string, color: string)
			{
				const data = await fetch(url).then((r) => r.json());
				if( !map.getSource(id) )
				{
					map.addSource(id, { type: "geojson", data });
				}
				if( !map.getLayer(`${id}-fill`) )
				{
					map.addLayer({
						id: `${id}-fill`,
						type: "fill",
						source: id,
						paint: { "fill-color": color, "fill-opacity": 0.5 },
					});
				}
				if( !map.getLayer(`${id}-line`) )
				{
					map.addLayer({
						id: `${id}-line`,
						type: "line",
						source: id,
						paint: { "line-color": color, "line-width": 2 },
					});
				}
				if( !map.getLayer(`${id}-label`) )
				{
					map.addLayer({
						id: `${id}-label`,
						type: "symbol",
						source: id,
						layout: {
							"text-field": ["get", "name"],
							"text-size": 14,
							"text-anchor": "center",
						},
						paint: {
							"text-color": "#000",
							"text-halo-color": "#fff",
							"text-halo-width": 1,
						},
					});
				}

				// 初期可視状態を反映
				["fill", "line", "label"].forEach((suffix) =>
				{
					const layerId = `${id}-${suffix}`;
					if( map.getLayer(layerId) )
					{
						map.setLayoutProperty(
							layerId,
							"visibility",
							layers[id] ? "visible" : "none"
						);
					}
				});
			}

			// 3 つの GeoJSON を事前ロード
			await addGeoLayer("dia", "/dia.json", "#3399ff");
			await addGeoLayer("heart", "/heart.json", "#ff66aa");
			await addGeoLayer("star", "/star.json", "#ff9933");
		});

		return () =>
		{
			map.remove();
		};
	}, []); // 初期化のみ

	// チェックボックスに応じて可視/不可視を切り替え
	useEffect(() =>
	{
		const map = mapRef.current;
		if( !map ) return;

		// 津波（単一レイヤ）
		if( map.getLayer("tsunami") )
		{
			map.setLayoutProperty("tsunami", "visibility", layers.tsunami ? "visible" : "none");
		}

		// GeoJSON 3種（fill/line/label の3レイヤをまとめて切替）
		(Object.entries(layers) as [string, boolean] [])
			.filter(([id]) => id !== "tsunami")
			.forEach(([id, visible]) =>
			{
				["fill", "line", "label"].forEach((suffix) =>
				{
					const layerId = `${id}-${suffix}`;
					if( map.getLayer(layerId) )
					{
						map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
					}
				});
			});
	}, [layers]);

	return (
		<div className="fixed inset-0">
			<div ref={containerRef} className="w-full h-full" />

			{/* UI パネル */}
			<div className="absolute top-3 left-3 z-10 bg-white/90 rounded p-3 shadow space-y-2">
				<label className="block">
					<input
						type="checkbox"
						checked={layers.tsunami}
						onChange={(e) => setLayers({ ...layers, tsunami: e.target.checked })}
					/>
					<span className="ml-2">津波（GSIラスタ）</span>
				</label>
				<label className="block">
					<input
						type="checkbox"
						checked={layers.dia}
						onChange={(e) => setLayers({ ...layers, dia: e.target.checked })}
					/>
					<span className="ml-2">ダイア（/dia.json）</span>
				</label>
				<label className="block">
					<input
						type="checkbox"
						checked={layers.heart}
						onChange={(e) => setLayers({ ...layers, heart: e.target.checked })}
					/>
					<span className="ml-2">ハート（/heart.json）</span>
				</label>
				<label className="block">
					<input
						type="checkbox"
						checked={layers.star}
						onChange={(e) => setLayers({ ...layers, star: e.target.checked })}
					/>
					<span className="ml-2">星（/star.json）</span>
				</label>
			</div>
		</div>
	);
}
