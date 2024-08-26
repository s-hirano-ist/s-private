"use strict";(self.webpackChunks_private=self.webpackChunks_private||[]).push([[143],{"./src/components/ui/button.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{$:()=>Button});var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/react/jsx-runtime.js"),_radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__("./node_modules/.pnpm/@radix-ui+react-slot@1.1.0_@types+react@18.3.4_react@18.3.1/node_modules/@radix-ui/react-slot/dist/index.mjs"),class_variance_authority__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__("./node_modules/.pnpm/class-variance-authority@0.7.0/node_modules/class-variance-authority/dist/index.mjs"),react__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/react/index.js"),_lib_utils__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./src/lib/utils.ts");function cov_2haofipeyz(){var path="/home/sola/personal/s-private/src/components/ui/button.tsx",global=new Function("return this")(),gcv="__coverage__",coverage=global[gcv]||(global[gcv]={});coverage[path]&&"3653c225558bf3129d24a2688ed0ff2cbe1d4e46"===coverage[path].hash||(coverage[path]={path:"/home/sola/personal/s-private/src/components/ui/button.tsx",statementMap:{0:{start:{line:6,column:23},end:{line:31,column:2}},1:{start:{line:32,column:29},end:{line:43,column:2}},2:{start:{line:33,column:17},end:{line:33,column:42}},3:{start:{line:34,column:4},end:{line:42,column:7}},4:{start:{line:44,column:0},end:{line:44,column:30}},5:{start:{line:46,column:0},end:{line:59,column:2}}},fnMap:{0:{name:"(anonymous_0)",decl:{start:{line:32,column:46},end:{line:32,column:47}},loc:{start:{line:32,column:110},end:{line:43,column:1}},line:32}},branchMap:{0:{loc:{start:{line:32,column:75},end:{line:32,column:90}},type:"default-arg",locations:[{start:{line:32,column:85},end:{line:32,column:90}}],line:32},1:{loc:{start:{line:33,column:17},end:{line:33,column:42}},type:"cond-expr",locations:[{start:{line:33,column:27},end:{line:33,column:31}},{start:{line:33,column:34},end:{line:33,column:42}}],line:33}},s:{0:0,1:0,2:0,3:0,4:0,5:0},f:{0:0},b:{0:[0],1:[0,0]},inputSourceMap:{version:3,sources:["/home/sola/personal/s-private/src/components/ui/button.tsx"],sourcesContent:['import { Slot } from "@radix-ui/react-slot";\nimport { type VariantProps, cva } from "class-variance-authority";\nimport * as React from "react";\n\nimport { cn } from "@/lib/utils";\n\nconst buttonVariants = cva(\n\t"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",\n\t{\n\t\tvariants: {\n\t\t\tvariant: {\n\t\t\t\tdefault:\n\t\t\t\t\t"bg-gradient-to-r from-primary to-primary-grad text-primary-foreground shadow hover:bg-black/40",\n\t\t\t\tdestructive:\n\t\t\t\t\t"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",\n\t\t\t\toutline:\n\t\t\t\t\t"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",\n\t\t\t\tsecondary:\n\t\t\t\t\t"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",\n\t\t\t\tghost: "hover:bg-accent hover:text-accent-foreground",\n\t\t\t\tlink: "text-white underline-offset-4 hover:underline",\n\t\t\t\tnavSide: "hover:bg-black/40 dark:hover:bg-gray-800",\n\t\t\t\tnavCenter: "bg-primary font-medium hover:bg-black/40",\n\t\t\t},\n\t\t\tsize: {\n\t\t\t\tdefault: "h-9 px-4 py-2",\n\t\t\t\tsm: "h-8 rounded-md px-3 text-xs",\n\t\t\t\tlg: "h-10 rounded-md px-8",\n\t\t\t\ticon: "size-9",\n\t\t\t\tnavSide: "size-full",\n\t\t\t\tnavCenter: "size-14 rounded-full",\n\t\t\t},\n\t\t},\n\t\tdefaultVariants: {\n\t\t\tvariant: "default",\n\t\t\tsize: "default",\n\t\t},\n\t},\n);\n\nexport interface ButtonProps\n\textends React.ButtonHTMLAttributes<HTMLButtonElement>,\n\t\tVariantProps<typeof buttonVariants> {\n\tasChild?: boolean;\n}\n\nconst Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n\t({ className, variant, size, asChild = false, ...props }, ref) => {\n\t\tconst Comp = asChild ? Slot : "button";\n\t\treturn (\n\t\t\t<Comp\n\t\t\t\tclassName={cn(buttonVariants({ variant, size, className }))}\n\t\t\t\tref={ref}\n\t\t\t\t{...props}\n\t\t\t/>\n\t\t);\n\t},\n);\nButton.displayName = "Button";\n\nexport { Button, buttonVariants };\n'],names:["Slot","cva","React","cn","buttonVariants","variants","variant","default","destructive","outline","secondary","ghost","link","navSide","navCenter","size","sm","lg","icon","defaultVariants","Button","forwardRef","className","asChild","props","ref","Comp","displayName"],mappings:";AAAA,SAASA,IAAI,QAAQ,uBAAuB;AAC5C,SAA4BC,GAAG,QAAQ,2BAA2B;AAClE,YAAYC,WAAW,QAAQ;AAE/B,SAASC,EAAE,QAAQ,cAAc;AAEjC,MAAMC,iBAAiBH,IACtB,uOACA;IACCI,UAAU;QACTC,SAAS;YACRC,SACC;YACDC,aACC;YACDC,SACC;YACDC,WACC;YACDC,OAAO;YACPC,MAAM;YACNC,SAAS;YACTC,WAAW;QACZ;QACAC,MAAM;YACLR,SAAS;YACTS,IAAI;YACJC,IAAI;YACJC,MAAM;YACNL,SAAS;YACTC,WAAW;QACZ;IACD;IACAK,iBAAiB;QAChBb,SAAS;QACTS,MAAM;IACP;AACD;AASD,MAAMK,uBAASlB,MAAMmB,UAAU,CAC9B,CAAC,EAAEC,SAAS,EAAEhB,OAAO,EAAES,IAAI,EAAEQ,UAAU,KAAK,EAAE,GAAGC,OAAO,EAAEC;IACzD,MAAMC,OAAOH,UAAUvB,OAAO;IAC9B,qBACC,KAAC0B;QACAJ,WAAWnB,GAAGC,eAAe;YAAEE;YAASS;YAAMO;QAAU;QACxDG,KAAKA;QACJ,GAAGD,KAAK;;AAGZ;AAEDJ,OAAOO,WAAW,GAAG;AAErB,SAASP,MAAM,EAAEhB,cAAc,GAAG"},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"3653c225558bf3129d24a2688ed0ff2cbe1d4e46"});var actualCoverage=coverage[path];return cov_2haofipeyz=function(){return actualCoverage},actualCoverage}cov_2haofipeyz();const buttonVariants=(cov_2haofipeyz().s[0]++,(0,class_variance_authority__WEBPACK_IMPORTED_MODULE_3__.F)("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-gradient-to-r from-primary to-primary-grad text-primary-foreground shadow hover:bg-black/40",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-white underline-offset-4 hover:underline",navSide:"hover:bg-black/40 dark:hover:bg-gray-800",navCenter:"bg-primary font-medium hover:bg-black/40"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"size-9",navSide:"size-full",navCenter:"size-14 rounded-full"}},defaultVariants:{variant:"default",size:"default"}})),Button=(cov_2haofipeyz().s[1]++,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef((({className,variant,size,asChild=(cov_2haofipeyz().b[0][0]++,!1),...props},ref)=>{cov_2haofipeyz().f[0]++;const Comp=(cov_2haofipeyz().s[2]++,asChild?(cov_2haofipeyz().b[1][0]++,_radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_4__.DX):(cov_2haofipeyz().b[1][1]++,"button"));return cov_2haofipeyz().s[3]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Comp,{className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)(buttonVariants({variant,size,className})),ref,...props})})));cov_2haofipeyz().s[4]++,Button.displayName="Button",cov_2haofipeyz().s[5]++,Button.__docgenInfo={description:"",methods:[],displayName:"Button",props:{asChild:{defaultValue:{value:"false",computed:!1},required:!1}}}},"./src/lib/utils.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{cn:()=>cn});var clsx__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs"),tailwind_merge__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/.pnpm/tailwind-merge@2.5.2/node_modules/tailwind-merge/dist/bundle-mjs.mjs");function cov_68t2gegd2(){var path="/home/sola/personal/s-private/src/lib/utils.ts",global=new Function("return this")(),gcv="__coverage__",coverage=global[gcv]||(global[gcv]={});coverage[path]&&"dbdd25337754048316c6e1c3896a76a72df5a745"===coverage[path].hash||(coverage[path]={path:"/home/sola/personal/s-private/src/lib/utils.ts",statementMap:{0:{start:{line:4,column:4},end:{line:4,column:33}},1:{start:{line:6,column:21},end:{line:6,column:85}},2:{start:{line:6,column:48},end:{line:6,column:85}},3:{start:{line:6,column:65},end:{line:6,column:84}}},fnMap:{0:{name:"cn",decl:{start:{line:3,column:16},end:{line:3,column:18}},loc:{start:{line:3,column:30},end:{line:5,column:1}},line:3},1:{name:"(anonymous_1)",decl:{start:{line:6,column:21},end:{line:6,column:22}},loc:{start:{line:6,column:48},end:{line:6,column:85}},line:6},2:{name:"(anonymous_2)",decl:{start:{line:6,column:60},end:{line:6,column:61}},loc:{start:{line:6,column:65},end:{line:6,column:84}},line:6}},branchMap:{},s:{0:0,1:0,2:0,3:0},f:{0:0,1:0,2:0},b:{},inputSourceMap:{version:3,sources:["/home/sola/personal/s-private/src/lib/utils.ts"],sourcesContent:['import { type ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n\treturn twMerge(clsx(inputs));\n}\n\nexport const sleep = (time: number /* milliseconds*/) =>\n\tnew Promise((r) => setTimeout(r, time));\n'],names:["clsx","twMerge","cn","inputs","sleep","time","Promise","r","setTimeout"],mappings:"AAAA,SAA0BA,IAAI,QAAQ,OAAO;AAC7C,SAASC,OAAO,QAAQ,iBAAiB;AAEzC,OAAO,SAASC,GAAG,GAAGC,MAAoB;IACzC,OAAOF,QAAQD,KAAKG;AACrB;AAEA,OAAO,MAAMC,QAAQ,CAACC,KAAa,eAAe,MACjD,IAAIC,QAAQ,CAACC,IAAMC,WAAWD,GAAGF,OAAO"},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"dbdd25337754048316c6e1c3896a76a72df5a745"});var actualCoverage=coverage[path];return cov_68t2gegd2=function(){return actualCoverage},actualCoverage}function cn(...inputs){return cov_68t2gegd2().f[0]++,cov_68t2gegd2().s[0]++,(0,tailwind_merge__WEBPACK_IMPORTED_MODULE_0__.QP)((0,clsx__WEBPACK_IMPORTED_MODULE_1__.$)(inputs))}cov_68t2gegd2(),cov_68t2gegd2().s[1]++},"./src/components/nav/header.stories.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{Main:()=>Main,__namedExportsOrder:()=>__namedExportsOrder,default:()=>header_stories});var jsx_runtime=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/react/jsx-runtime.js"),dist=__webpack_require__("./node_modules/.pnpm/next-view-transitions@0.3.0_next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@_udezwf34ynviggzzosesbzon24/node_modules/next-view-transitions/dist/index.js"),next_image=__webpack_require__("./node_modules/.pnpm/@storybook+nextjs@8.2.9_@jest+globals@29.7.0_@swc+core@1.6.7_@swc+helpers@0.5.5__esbuild@0.21_up6nydr2ahqwavguhubq7o2xrm/node_modules/@storybook/nextjs/dist/images/next-image.mjs"),ui_button=__webpack_require__("./src/components/ui/button.tsx");function cov_2kxhdc398h(){var path="/home/sola/personal/s-private/src/components/nav/header.tsx",global=new Function("return this")(),gcv="__coverage__",coverage=global[gcv]||(global[gcv]={});coverage[path]&&"d75839abb4dea201e7020cdd16adf2db5b60f040"===coverage[path].hash||(coverage[path]={path:"/home/sola/personal/s-private/src/components/nav/header.tsx",statementMap:{0:{start:{line:8,column:4},end:{line:40,column:7}},1:{start:{line:42,column:0},end:{line:62,column:2}}},fnMap:{0:{name:"Header",decl:{start:{line:7,column:16},end:{line:7,column:22}},loc:{start:{line:7,column:39},end:{line:41,column:1}},line:7}},branchMap:{0:{loc:{start:{line:25,column:20},end:{line:36,column:22}},type:"cond-expr",locations:[{start:{line:25,column:40},end:{line:33,column:22}},{start:{line:33,column:39},end:{line:36,column:22}}],line:25}},s:{0:0,1:0},f:{0:0},b:{0:[0,0]},inputSourceMap:{version:3,sources:["/home/sola/personal/s-private/src/components/nav/header.tsx"],sourcesContent:['"use client";\nimport { Link } from "next-view-transitions";\n// import { MoonIcon, SunIcon } from "@radix-ui/react-icons";\nimport Image from "next/image";\nimport { Button } from "../ui/button";\n\ntype Props = {\n\ttitle: string;\n\turl?: string;\n};\n\nexport function Header({ title, url }: Props) {\n\treturn (\n\t\t<header className="sticky top-0 z-50 w-full bg-gradient-to-b from-primary to-primary-grad p-2 text-white">\n\t\t\t<div className="flex items-center justify-between px-2">\n\t\t\t\t<div className="flex items-center justify-start">\n\t\t\t\t\t<Link href="/">\n\t\t\t\t\t\t<Image\n\t\t\t\t\t\t\tsrc="/apple-icon.png"\n\t\t\t\t\t\t\twidth={50}\n\t\t\t\t\t\t\theight={50}\n\t\t\t\t\t\t\talt=""\n\t\t\t\t\t\t\tclassName="size-8 object-cover"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</Link>\n\t\t\t\t\t{url ? (\n\t\t\t\t\t\t<Link href={new URL(url)} target="_blank">\n\t\t\t\t\t\t\t<Button variant="link" className="text-xl font-semibold">\n\t\t\t\t\t\t\t\t{title}\n\t\t\t\t\t\t\t</Button>\n\t\t\t\t\t\t</Link>\n\t\t\t\t\t) : (\n\t\t\t\t\t\t<p className="px-4 py-1 text-xl font-semibold">{title}</p>\n\t\t\t\t\t)}\n\t\t\t\t</div>\n\t\t\t\t{/* TODO: add theme button */}\n\t\t\t\t{/* <nav>\n\t\t\t\t\t<Button\n\t\t\t\t\t\tvariant="ghost"\n\t\t\t\t\t\tonClick={() => setTheme("light")}\n\t\t\t\t\t\tclassName="block dark:hidden"\n\t\t\t\t\t>\n\t\t\t\t\t\t<MoonIcon className="size-8" />\n\t\t\t\t\t\t<span className="sr-only">light theme button</span>\n\t\t\t\t\t</Button>\n\t\t\t\t\t<Button\n\t\t\t\t\t\tvariant="ghost"\n\t\t\t\t\t\tonClick={() => setTheme("dark")}\n\t\t\t\t\t\tclassName="hidden dark:block"\n\t\t\t\t\t>\n\t\t\t\t\t\t<SunIcon className="size-8" />\n\t\t\t\t\t\t<span className="sr-only">dark theme button</span>\n\t\t\t\t\t</Button>\n\t\t\t\t</nav> */}\n\t\t\t</div>\n\t\t</header>\n\t);\n}\n'],names:["Link","Image","Button","Header","title","url","header","className","div","href","src","width","height","alt","URL","target","variant","p"],mappings:"AAAA;;AACA,SAASA,IAAI,QAAQ,wBAAwB;AAC7C,6DAA6D;AAC7D,OAAOC,WAAW,aAAa;AAC/B,SAASC,MAAM,QAAQ,eAAe;AAOtC,OAAO,SAASC,OAAO,EAAEC,KAAK,EAAEC,GAAG,EAAS;IAC3C,qBACC,KAACC;QAAOC,WAAU;kBACjB,cAAA,KAACC;YAAID,WAAU;sBACd,cAAA,MAACC;gBAAID,WAAU;;kCACd,KAACP;wBAAKS,MAAK;kCACV,cAAA,KAACR;4BACAS,KAAI;4BACJC,OAAO;4BACPC,QAAQ;4BACRC,KAAI;4BACJN,WAAU;;;oBAGXF,oBACA,KAACL;wBAAKS,MAAM,IAAIK,IAAIT;wBAAMU,QAAO;kCAChC,cAAA,KAACb;4BAAOc,SAAQ;4BAAOT,WAAU;sCAC/BH;;uCAIH,KAACa;wBAAEV,WAAU;kCAAmCH;;;;;;AAyBtD"},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"d75839abb4dea201e7020cdd16adf2db5b60f040"});var actualCoverage=coverage[path];return cov_2kxhdc398h=function(){return actualCoverage},actualCoverage}function Header({title,url}){return cov_2kxhdc398h().f[0]++,cov_2kxhdc398h().s[0]++,(0,jsx_runtime.jsx)("header",{className:"sticky top-0 z-50 w-full bg-gradient-to-b from-primary to-primary-grad p-2 text-white",children:(0,jsx_runtime.jsx)("div",{className:"flex items-center justify-between px-2",children:(0,jsx_runtime.jsxs)("div",{className:"flex items-center justify-start",children:[(0,jsx_runtime.jsx)(dist.N_,{href:"/",children:(0,jsx_runtime.jsx)(next_image.A,{src:"/apple-icon.png",width:50,height:50,alt:"",className:"size-8 object-cover"})}),url?(cov_2kxhdc398h().b[0][0]++,(0,jsx_runtime.jsx)(dist.N_,{href:new URL(url),target:"_blank",children:(0,jsx_runtime.jsx)(ui_button.$,{variant:"link",className:"text-xl font-semibold",children:title})})):(cov_2kxhdc398h().b[0][1]++,(0,jsx_runtime.jsx)("p",{className:"px-4 py-1 text-xl font-semibold",children:title}))]})})})}cov_2kxhdc398h(),cov_2kxhdc398h().s[1]++,Header.__docgenInfo={description:"",methods:[],displayName:"Header",props:{title:{required:!0,tsType:{name:"string"},description:""},url:{required:!1,tsType:{name:"string"},description:""}}};const header_stories={title:"Components/Nav/Header",component:Header,tags:["autodocs"],parameters:{layout:"fullscreen"}},Main={args:{title:"Sample Title"}},__namedExportsOrder=["Main"];Main.parameters={...Main.parameters,docs:{...Main.parameters?.docs,source:{originalSource:'{\n  args: {\n    title: "Sample Title"\n  }\n}',...Main.parameters?.docs?.source}}}}}]);