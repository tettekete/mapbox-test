import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from '@mapbox/mapbox-gl-language';
	// 地名の日本語化モジュール。サポートしているのは Mapbox v8 style ベースのマップのみ
	// → https://www.npmjs.com/package/@mapbox/mapbox-gl-language#supported-styles
import "mapbox-gl/dist/mapbox-gl.css";
import { restoreShuffledToken } from '../lib/obfuscation';


/**
 * 使い方
 * 1) 要 `npm i mapbox-gl`
 * 2) Mapboxのアクセストークンを環境変数に設定（例：Viteなら .env に VITE_MAPBOX_TOKEN=...）
 * 3) <TsunamiHazardMap /> をアプリに組み込む
 * 4) Tailwind を使うとUIが綺麗になります（未設定でも機能は動作）
 *
 * 注意
 * - 津波タイルは国土地理院「重ねるハザードマップ」のオープンデータ（PNGラスタ・XYZ）を使用
 *   URL: https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png
 *   ズーム: 2〜17 を想定
 * - 出典表記："ハザードマップポータルサイト" へのリンクをアプリ上の帰属表示に追加してください
 */

// ボット対策の難読化済みのトークンを元に戻します
mapboxgl.accessToken = restoreShuffledToken(
	import.meta.env.VITE_MAPBOX_TOKEN_SHUF || "YOUR_MAPBOX_ACCESS_TOKEN",
	'map+box@test'.replace( /\W/g,'' )
);

export default function TsunamiHazardMap()
{
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	// UI 状態
	const [opacity, setOpacity] = useState(0.7);
	const [styleId, setStyleId] = useState("mapbox://styles/mapbox/streets-v11");


	useEffect(() =>
	{
		if (!containerRef.current) return;

		const map = new mapboxgl.Map(
		{
			container: containerRef.current,
			style: styleId,
			center: [140.8719, 38.2682], // 仙台付近（例）
			zoom: 10,
			hash: true,
			attributionControl: false,
		});

		mapRef.current = map;

		// ホットリロード時の canvas 更新不良対策
		const ro = new ResizeObserver(() => map.resize());
		if( containerRef.current ){ ro.observe(containerRef.current) };

		const onWinResize = () => map.resize();
		window.addEventListener("resize", onWinResize);

		const onVis = () => { if (document.visibilityState === "visible") map.resize(); };
		document.addEventListener("visibilitychange", onVis);

		if (import.meta.hot)
		{
			import.meta.hot.accept(() => {
			// スタイルだけ変わった時にも追従
			map.resize();
			});
		}

		// 基本コントロール
		map.addControl(new MapboxLanguage({ defaultLanguage: 'ja' }));
		map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-left");
		map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }));
		map.addControl(
			new mapboxgl.GeolocateControl(
			{
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true,
				showUserHeading: true,
			}), "top-left");

		// 帰属表記（GSI + Mapbox）
		map.addControl(
			new mapboxgl.AttributionControl(
			{
				compact: true,
				customAttribution:
					'<a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/copyright/opendata.html" target="_blank" rel="noreferrer">ハザードマップポータルサイト</a>',
			})
		);

		map.on("load", () => {
			// 津波ハザード（GSI ラスタ）
			if (!map.getSource("gsi-tsunami"))
			{
				map.addSource(
					"gsi-tsunami",
					{
						type: "raster",
						tiles: [
						"https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png",
						],
						tileSize: 256,
						minzoom: 2,
						maxzoom: 17,
						attribution:
						'<a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/copyright/opendata.html" target="_blank" rel="noreferrer">ハザードマップポータルサイト</a>',
					} as mapboxgl.RasterSourceSpecification
				);
			}

			if (!map.getLayer("gsi-tsunami-layer"))
			{
				map.addLayer(
					{
						id: "gsi-tsunami-layer",
						type: "raster",
						source: "gsi-tsunami",
						paint:
						{
							"raster-opacity": opacity,
						},
				});
			}
		});

		return () =>
		{
			ro.disconnect();
			window.removeEventListener("resize", onWinResize);
			document.removeEventListener("visibilitychange", onVis);
			map.remove();
			mapRef.current = null;
		};
	}, [styleId]);

	// 透過度をリアルタイム更新
	useEffect(() =>
		{
			const map = mapRef.current;
			if (map && map.getLayer("gsi-tsunami-layer"))
			{
				map.setPaintProperty("gsi-tsunami-layer", "raster-opacity", opacity);
			}
		},
		[opacity]
	);

	return (
	<div className="relative h-screen w-full">
		{/* 地図本体 */}
		<div ref={containerRef} style={{ position: 'absolute', inset: 0, outline: '2px solid red' }} />

		{/* コントロールパネル */}
		<div className="absolute z-10 top-3 right-3 bg-white/90 backdrop-blur rounded-2xl shadow p-3 w-72 space-y-3">
		<h2 className="text-sm font-semibold">津波ハザード（GSI）</h2>

		<label className="block text-xs font-medium">透過度: {opacity.toFixed(2)}</label>
		<input
			type="range"
			min={0}
			max={1}
			step={0.01}
			value={opacity}
			onChange={(e) => setOpacity(parseFloat(e.target.value))}
			className="w-full"
		/>

		<div className="grid grid-cols-2 gap-2 text-xs">
		<button
			className={`border rounded-xl px-2 py-1 text-left hover:shadow ${
				styleId.includes("streets") ? "bg-gray-100" : "bg-white"
			}`}
			onClick={() => setStyleId("mapbox://styles/mapbox/streets-v12")}
			>
			Streets
			</button>
		<button
			className={`border rounded-xl px-2 py-1 text-left hover:shadow ${
				styleId.includes("outdoors") ? "bg-gray-100" : "bg-white"
			}`}
			onClick={() => setStyleId("mapbox://styles/mapbox/outdoors-v12")}
			>
			Outdoors
			</button>
			<button
			className={`border rounded-xl px-2 py-1 text-left hover:shadow ${
				styleId.includes("light") ? "bg-gray-100" : "bg-white"
			}`}
			onClick={() => setStyleId("mapbox://styles/mapbox/light-v11")}
			>
			Light
			</button>
			<button
			className={`border rounded-xl px-2 py-1 text-left hover:shadow ${
				styleId.includes("satellite") ? "bg-gray-100" : "bg-white"
			}`}
			onClick={() => setStyleId("mapbox://styles/mapbox/satellite-streets-v12")}
			>
			Satellite
			</button>
		</div>

		<div className="text-[11px] leading-snug text-gray-600">
			<p>
			凡例は「浸水深（8段階）」です。詳しくは
			<a
				className="underline ml-1"
				href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/faq/legend.pdf"
				target="_blank"
				rel="noreferrer"
			>
				公式凡例資料
			</a>
			を参照してください。
			</p>
		</div>
		</div>
	</div>
	);
}

