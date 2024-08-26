"use strict";(self.webpackChunks_private=self.webpackChunks_private||[]).push([[867],{"./src/components/ui/badge.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{E:()=>Badge});var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/react/jsx-runtime.js"),class_variance_authority__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./node_modules/.pnpm/class-variance-authority@0.7.0/node_modules/class-variance-authority/dist/index.mjs"),_lib_utils__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./src/lib/utils.ts");function cov_u54srejza(){var path="/home/sola/personal/s-private/src/components/ui/badge.tsx",global=new Function("return this")(),gcv="__coverage__",coverage=global[gcv]||(global[gcv]={});coverage[path]&&"6e7b41c646eedcd032803fb47cec61b618f7d8f5"===coverage[path].hash||(coverage[path]={path:"/home/sola/personal/s-private/src/components/ui/badge.tsx",statementMap:{0:{start:{line:4,column:22},end:{line:16,column:2}},1:{start:{line:18,column:4},end:{line:23,column:7}},2:{start:{line:26,column:0},end:{line:33,column:2}}},fnMap:{0:{name:"Badge",decl:{start:{line:17,column:9},end:{line:17,column:14}},loc:{start:{line:17,column:49},end:{line:24,column:1}},line:17}},branchMap:{},s:{0:0,1:0,2:0},f:{0:0},b:{},inputSourceMap:{version:3,sources:["/home/sola/personal/s-private/src/components/ui/badge.tsx"],sourcesContent:['import { type VariantProps, cva } from "class-variance-authority";\n\nimport { cn } from "@/lib/utils";\n\nconst badgeVariants = cva(\n\t"inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",\n\t{\n\t\tvariants: {\n\t\t\tvariant: {\n\t\t\t\tdefault:\n\t\t\t\t\t"border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",\n\t\t\t\tsecondary:\n\t\t\t\t\t"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",\n\t\t\t\tdestructive:\n\t\t\t\t\t"border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",\n\t\t\t\toutline: "text-foreground",\n\t\t\t},\n\t\t},\n\t\tdefaultVariants: {\n\t\t\tvariant: "default",\n\t\t},\n\t},\n);\n\nexport interface BadgeProps\n\textends React.HTMLAttributes<HTMLDivElement>,\n\t\tVariantProps<typeof badgeVariants> {}\n\nfunction Badge({ className, variant, ...props }: BadgeProps) {\n\treturn (\n\t\t<div className={cn(badgeVariants({ variant }), className)} {...props} />\n\t);\n}\n\nexport { Badge, badgeVariants };\n'],names:["cva","cn","badgeVariants","variants","variant","default","secondary","destructive","outline","defaultVariants","Badge","className","props","div"],mappings:";AAAA,SAA4BA,GAAG,QAAQ,2BAA2B;AAElE,SAASC,EAAE,QAAQ,cAAc;AAEjC,MAAMC,gBAAgBF,IACrB,wKACA;IACCG,UAAU;QACTC,SAAS;YACRC,SACC;YACDC,WACC;YACDC,aACC;YACDC,SAAS;QACV;IACD;IACAC,iBAAiB;QAChBL,SAAS;IACV;AACD;AAOD,SAASM,MAAM,EAAEC,SAAS,EAAEP,OAAO,EAAE,GAAGQ,OAAmB;IAC1D,qBACC,KAACC;QAAIF,WAAWV,GAAGC,cAAc;YAAEE;QAAQ,IAAIO;QAAa,GAAGC,KAAK;;AAEtE;AAEA,SAASF,KAAK,EAAER,aAAa,GAAG"},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"6e7b41c646eedcd032803fb47cec61b618f7d8f5"});var actualCoverage=coverage[path];return cov_u54srejza=function(){return actualCoverage},actualCoverage}cov_u54srejza();const badgeVariants=(cov_u54srejza().s[0]++,(0,class_variance_authority__WEBPACK_IMPORTED_MODULE_2__.F)("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",secondary:"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",destructive:"border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",outline:"text-foreground"}},defaultVariants:{variant:"default"}}));function Badge({className,variant,...props}){return cov_u54srejza().f[0]++,cov_u54srejza().s[1]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div",{className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_1__.cn)(badgeVariants({variant}),className),...props})}cov_u54srejza().s[2]++,Badge.__docgenInfo={description:"",methods:[],displayName:"Badge",composes:["VariantProps"]}},"./src/components/ui/card.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{BT:()=>CardDescription,Wu:()=>CardContent,ZB:()=>CardTitle,Zp:()=>Card,aR:()=>CardHeader,wL:()=>CardFooter});var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/react/jsx-runtime.js"),react__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/react/index.js"),_lib_utils__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("./src/lib/utils.ts");function cov_1zkjhqakd9(){var path="/home/sola/personal/s-private/src/components/ui/card.tsx",global=new Function("return this")(),gcv="__coverage__",coverage=global[gcv]||(global[gcv]={});coverage[path]&&"088c92b8d2876428f22a8be49b08bd9ac364d216"===coverage[path].hash||(coverage[path]={path:"/home/sola/personal/s-private/src/components/ui/card.tsx",statementMap:{0:{start:{line:4,column:27},end:{line:8,column:7}},1:{start:{line:4,column:90},end:{line:8,column:6}},2:{start:{line:9,column:0},end:{line:9,column:26}},3:{start:{line:10,column:33},end:{line:14,column:7}},4:{start:{line:10,column:96},end:{line:14,column:6}},5:{start:{line:15,column:0},end:{line:15,column:38}},6:{start:{line:16,column:32},end:{line:20,column:7}},7:{start:{line:16,column:95},end:{line:20,column:6}},8:{start:{line:21,column:0},end:{line:21,column:36}},9:{start:{line:22,column:38},end:{line:26,column:7}},10:{start:{line:22,column:101},end:{line:26,column:6}},11:{start:{line:27,column:0},end:{line:27,column:48}},12:{start:{line:28,column:34},end:{line:32,column:7}},13:{start:{line:28,column:97},end:{line:32,column:6}},14:{start:{line:33,column:0},end:{line:33,column:40}},15:{start:{line:34,column:33},end:{line:38,column:7}},16:{start:{line:34,column:96},end:{line:38,column:6}},17:{start:{line:39,column:0},end:{line:39,column:38}},18:{start:{line:41,column:0},end:{line:45,column:2}},19:{start:{line:46,column:0},end:{line:50,column:2}},20:{start:{line:51,column:0},end:{line:55,column:2}},21:{start:{line:56,column:0},end:{line:60,column:2}},22:{start:{line:61,column:0},end:{line:65,column:2}},23:{start:{line:66,column:0},end:{line:70,column:2}}},fnMap:{0:{name:"(anonymous_0)",decl:{start:{line:4,column:44},end:{line:4,column:45}},loc:{start:{line:4,column:90},end:{line:8,column:6}},line:4},1:{name:"(anonymous_1)",decl:{start:{line:10,column:50},end:{line:10,column:51}},loc:{start:{line:10,column:96},end:{line:14,column:6}},line:10},2:{name:"(anonymous_2)",decl:{start:{line:16,column:49},end:{line:16,column:50}},loc:{start:{line:16,column:95},end:{line:20,column:6}},line:16},3:{name:"(anonymous_3)",decl:{start:{line:22,column:55},end:{line:22,column:56}},loc:{start:{line:22,column:101},end:{line:26,column:6}},line:22},4:{name:"(anonymous_4)",decl:{start:{line:28,column:51},end:{line:28,column:52}},loc:{start:{line:28,column:97},end:{line:32,column:6}},line:28},5:{name:"(anonymous_5)",decl:{start:{line:34,column:50},end:{line:34,column:51}},loc:{start:{line:34,column:96},end:{line:38,column:6}},line:34}},branchMap:{},s:{0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:0,16:0,17:0,18:0,19:0,20:0,21:0,22:0,23:0},f:{0:0,1:0,2:0,3:0,4:0,5:0},b:{},inputSourceMap:{version:3,sources:["/home/sola/personal/s-private/src/components/ui/card.tsx"],sourcesContent:['import * as React from "react";\n\nimport { cn } from "@/lib/utils";\n\nconst Card = React.forwardRef<\n\tHTMLDivElement,\n\tReact.HTMLAttributes<HTMLDivElement>\n>(({ className, ...props }, ref) => (\n\t<div\n\t\tref={ref}\n\t\tclassName={cn(\n\t\t\t"rounded-xl border bg-card text-card-foreground shadow",\n\t\t\tclassName,\n\t\t)}\n\t\t{...props}\n\t/>\n));\nCard.displayName = "Card";\n\nconst CardHeader = React.forwardRef<\n\tHTMLDivElement,\n\tReact.HTMLAttributes<HTMLDivElement>\n>(({ className, ...props }, ref) => (\n\t<div\n\t\tref={ref}\n\t\tclassName={cn("flex flex-col space-y-1.5 p-6", className)}\n\t\t{...props}\n\t/>\n));\nCardHeader.displayName = "CardHeader";\n\nconst CardTitle = React.forwardRef<\n\tHTMLParagraphElement,\n\tReact.HTMLAttributes<HTMLHeadingElement>\n>(({ className, ...props }, ref) => (\n\t<h3\n\t\tref={ref}\n\t\tclassName={cn(\n\t\t\t"font-bold text-primary leading-none tracking-tight",\n\t\t\tclassName,\n\t\t)}\n\t\t{...props}\n\t/>\n));\nCardTitle.displayName = "CardTitle";\n\nconst CardDescription = React.forwardRef<\n\tHTMLParagraphElement,\n\tReact.HTMLAttributes<HTMLParagraphElement>\n>(({ className, ...props }, ref) => (\n\t<p\n\t\tref={ref}\n\t\tclassName={cn("text-sm text-muted-foreground", className)}\n\t\t{...props}\n\t/>\n));\nCardDescription.displayName = "CardDescription";\n\nconst CardContent = React.forwardRef<\n\tHTMLDivElement,\n\tReact.HTMLAttributes<HTMLDivElement>\n>(({ className, ...props }, ref) => (\n\t<div ref={ref} className={cn("p-6 pt-0", className)} {...props} />\n));\nCardContent.displayName = "CardContent";\n\nconst CardFooter = React.forwardRef<\n\tHTMLDivElement,\n\tReact.HTMLAttributes<HTMLDivElement>\n>(({ className, ...props }, ref) => (\n\t<div\n\t\tref={ref}\n\t\tclassName={cn("flex items-center p-6 pt-0", className)}\n\t\t{...props}\n\t/>\n));\nCardFooter.displayName = "CardFooter";\n\nexport {\n\tCard,\n\tCardHeader,\n\tCardFooter,\n\tCardTitle,\n\tCardDescription,\n\tCardContent,\n};\n'],names:["React","cn","Card","forwardRef","className","props","ref","div","displayName","CardHeader","CardTitle","h3","CardDescription","p","CardContent","CardFooter"],mappings:";AAAA,YAAYA,WAAW,QAAQ;AAE/B,SAASC,EAAE,QAAQ,cAAc;AAEjC,MAAMC,qBAAOF,MAAMG,UAAU,CAG3B,CAAC,EAAEC,SAAS,EAAE,GAAGC,OAAO,EAAEC,oBAC3B,KAACC;QACAD,KAAKA;QACLF,WAAWH,GACV,yDACAG;QAEA,GAAGC,KAAK;;AAGXH,KAAKM,WAAW,GAAG;AAEnB,MAAMC,2BAAaT,MAAMG,UAAU,CAGjC,CAAC,EAAEC,SAAS,EAAE,GAAGC,OAAO,EAAEC,oBAC3B,KAACC;QACAD,KAAKA;QACLF,WAAWH,GAAG,iCAAiCG;QAC9C,GAAGC,KAAK;;AAGXI,WAAWD,WAAW,GAAG;AAEzB,MAAME,0BAAYV,MAAMG,UAAU,CAGhC,CAAC,EAAEC,SAAS,EAAE,GAAGC,OAAO,EAAEC,oBAC3B,KAACK;QACAL,KAAKA;QACLF,WAAWH,GACV,sDACAG;QAEA,GAAGC,KAAK;;AAGXK,UAAUF,WAAW,GAAG;AAExB,MAAMI,gCAAkBZ,MAAMG,UAAU,CAGtC,CAAC,EAAEC,SAAS,EAAE,GAAGC,OAAO,EAAEC,oBAC3B,KAACO;QACAP,KAAKA;QACLF,WAAWH,GAAG,iCAAiCG;QAC9C,GAAGC,KAAK;;AAGXO,gBAAgBJ,WAAW,GAAG;AAE9B,MAAMM,4BAAcd,MAAMG,UAAU,CAGlC,CAAC,EAAEC,SAAS,EAAE,GAAGC,OAAO,EAAEC,oBAC3B,KAACC;QAAID,KAAKA;QAAKF,WAAWH,GAAG,YAAYG;QAAa,GAAGC,KAAK;;AAE/DS,YAAYN,WAAW,GAAG;AAE1B,MAAMO,2BAAaf,MAAMG,UAAU,CAGjC,CAAC,EAAEC,SAAS,EAAE,GAAGC,OAAO,EAAEC,oBAC3B,KAACC;QACAD,KAAKA;QACLF,WAAWH,GAAG,8BAA8BG;QAC3C,GAAGC,KAAK;;AAGXU,WAAWP,WAAW,GAAG;AAEzB,SACCN,IAAI,EACJO,UAAU,EACVM,UAAU,EACVL,SAAS,EACTE,eAAe,EACfE,WAAW,GACV"},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"088c92b8d2876428f22a8be49b08bd9ac364d216"});var actualCoverage=coverage[path];return cov_1zkjhqakd9=function(){return actualCoverage},actualCoverage}cov_1zkjhqakd9();const Card=(cov_1zkjhqakd9().s[0]++,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef((({className,...props},ref)=>(cov_1zkjhqakd9().f[0]++,cov_1zkjhqakd9().s[1]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div",{ref,className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)("rounded-xl border bg-card text-card-foreground shadow",className),...props})))));cov_1zkjhqakd9().s[2]++,Card.displayName="Card";const CardHeader=(cov_1zkjhqakd9().s[3]++,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef((({className,...props},ref)=>(cov_1zkjhqakd9().f[1]++,cov_1zkjhqakd9().s[4]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div",{ref,className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)("flex flex-col space-y-1.5 p-6",className),...props})))));cov_1zkjhqakd9().s[5]++,CardHeader.displayName="CardHeader";const CardTitle=(cov_1zkjhqakd9().s[6]++,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef((({className,...props},ref)=>(cov_1zkjhqakd9().f[2]++,cov_1zkjhqakd9().s[7]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3",{ref,className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)("font-bold text-primary leading-none tracking-tight",className),...props})))));cov_1zkjhqakd9().s[8]++,CardTitle.displayName="CardTitle";const CardDescription=(cov_1zkjhqakd9().s[9]++,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef((({className,...props},ref)=>(cov_1zkjhqakd9().f[3]++,cov_1zkjhqakd9().s[10]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p",{ref,className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)("text-sm text-muted-foreground",className),...props})))));cov_1zkjhqakd9().s[11]++,CardDescription.displayName="CardDescription";const CardContent=(cov_1zkjhqakd9().s[12]++,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef((({className,...props},ref)=>(cov_1zkjhqakd9().f[4]++,cov_1zkjhqakd9().s[13]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div",{ref,className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)("p-6 pt-0",className),...props})))));cov_1zkjhqakd9().s[14]++,CardContent.displayName="CardContent";const CardFooter=(cov_1zkjhqakd9().s[15]++,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef((({className,...props},ref)=>(cov_1zkjhqakd9().f[5]++,cov_1zkjhqakd9().s[16]++,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div",{ref,className:(0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)("flex items-center p-6 pt-0",className),...props})))));cov_1zkjhqakd9().s[17]++,CardFooter.displayName="CardFooter",cov_1zkjhqakd9().s[18]++,Card.__docgenInfo={description:"",methods:[],displayName:"Card"},cov_1zkjhqakd9().s[19]++,CardHeader.__docgenInfo={description:"",methods:[],displayName:"CardHeader"},cov_1zkjhqakd9().s[20]++,CardFooter.__docgenInfo={description:"",methods:[],displayName:"CardFooter"},cov_1zkjhqakd9().s[21]++,CardTitle.__docgenInfo={description:"",methods:[],displayName:"CardTitle"},cov_1zkjhqakd9().s[22]++,CardDescription.__docgenInfo={description:"",methods:[],displayName:"CardDescription"},cov_1zkjhqakd9().s[23]++,CardContent.__docgenInfo={description:"",methods:[],displayName:"CardContent"}},"./src/lib/utils.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{cn:()=>cn});var clsx__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("./node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs"),tailwind_merge__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("./node_modules/.pnpm/tailwind-merge@2.5.2/node_modules/tailwind-merge/dist/bundle-mjs.mjs");function cov_68t2gegd2(){var path="/home/sola/personal/s-private/src/lib/utils.ts",global=new Function("return this")(),gcv="__coverage__",coverage=global[gcv]||(global[gcv]={});coverage[path]&&"dbdd25337754048316c6e1c3896a76a72df5a745"===coverage[path].hash||(coverage[path]={path:"/home/sola/personal/s-private/src/lib/utils.ts",statementMap:{0:{start:{line:4,column:4},end:{line:4,column:33}},1:{start:{line:6,column:21},end:{line:6,column:85}},2:{start:{line:6,column:48},end:{line:6,column:85}},3:{start:{line:6,column:65},end:{line:6,column:84}}},fnMap:{0:{name:"cn",decl:{start:{line:3,column:16},end:{line:3,column:18}},loc:{start:{line:3,column:30},end:{line:5,column:1}},line:3},1:{name:"(anonymous_1)",decl:{start:{line:6,column:21},end:{line:6,column:22}},loc:{start:{line:6,column:48},end:{line:6,column:85}},line:6},2:{name:"(anonymous_2)",decl:{start:{line:6,column:60},end:{line:6,column:61}},loc:{start:{line:6,column:65},end:{line:6,column:84}},line:6}},branchMap:{},s:{0:0,1:0,2:0,3:0},f:{0:0,1:0,2:0},b:{},inputSourceMap:{version:3,sources:["/home/sola/personal/s-private/src/lib/utils.ts"],sourcesContent:['import { type ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n\treturn twMerge(clsx(inputs));\n}\n\nexport const sleep = (time: number /* milliseconds*/) =>\n\tnew Promise((r) => setTimeout(r, time));\n'],names:["clsx","twMerge","cn","inputs","sleep","time","Promise","r","setTimeout"],mappings:"AAAA,SAA0BA,IAAI,QAAQ,OAAO;AAC7C,SAASC,OAAO,QAAQ,iBAAiB;AAEzC,OAAO,SAASC,GAAG,GAAGC,MAAoB;IACzC,OAAOF,QAAQD,KAAKG;AACrB;AAEA,OAAO,MAAMC,QAAQ,CAACC,KAAa,eAAe,MACjD,IAAIC,QAAQ,CAACC,IAAMC,WAAWD,GAAGF,OAAO"},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"dbdd25337754048316c6e1c3896a76a72df5a745"});var actualCoverage=coverage[path];return cov_68t2gegd2=function(){return actualCoverage},actualCoverage}function cn(...inputs){return cov_68t2gegd2().f[0]++,cov_68t2gegd2().s[0]++,(0,tailwind_merge__WEBPACK_IMPORTED_MODULE_0__.QP)((0,clsx__WEBPACK_IMPORTED_MODULE_1__.$)(inputs))}cov_68t2gegd2(),cov_68t2gegd2().s[1]++},"./src/components/stack/content-stack.stories.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{Default:()=>Default,__namedExportsOrder:()=>__namedExportsOrder,default:()=>content_stack_stories});var jsx_runtime=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/react/jsx-runtime.js"),badge=__webpack_require__("./src/components/ui/badge.tsx"),card=__webpack_require__("./src/components/ui/card.tsx"),next_link=__webpack_require__("./node_modules/.pnpm/next@14.2.6_@babel+core@7.24.7_@playwright+test@1.46.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/link.js"),link_default=__webpack_require__.n(next_link);function cov_16o5l6rpk2(){var path="/home/sola/personal/s-private/src/components/stack/content-stack.tsx",global=new Function("return this")(),gcv="__coverage__",coverage=global[gcv]||(global[gcv]={});coverage[path]&&"bd5d2ddc7ddfc94d3c816ce511a51d537cb7876a"===coverage[path].hash||(coverage[path]={path:"/home/sola/personal/s-private/src/components/stack/content-stack.tsx",statementMap:{0:{start:{line:6,column:4},end:{line:39,column:7}},1:{start:{line:41,column:0},end:{line:91,column:2}}},fnMap:{0:{name:"ContentStack",decl:{start:{line:5,column:16},end:{line:5,column:28}},loc:{start:{line:5,column:66},end:{line:40,column:1}},line:5}},branchMap:{0:{loc:{start:{line:19,column:28},end:{line:22,column:30}},type:"binary-expr",locations:[{start:{line:19,column:28},end:{line:19,column:36}},{start:{line:19,column:54},end:{line:22,column:30}}],line:19},1:{loc:{start:{line:33,column:38},end:{line:33,column:57}},type:"cond-expr",locations:[{start:{line:33,column:46},end:{line:33,column:51}},{start:{line:33,column:54},end:{line:33,column:57}}],line:33}},s:{0:0,1:0},f:{0:0},b:{0:[0,0],1:[0,0]},inputSourceMap:{version:3,sources:["/home/sola/personal/s-private/src/components/stack/content-stack.tsx"],sourcesContent:['import { Badge } from "@/components/ui/badge";\nimport {\n\tCard,\n\tCardContent,\n\tCardDescription,\n\tCardHeader,\n\tCardTitle,\n} from "@/components/ui/card";\nimport Link from "next/link";\n\ntype Props = {\n\tid: number;\n\ttitle: string;\n\tquote: string | null;\n\turl: string;\n\tcategory?: string;\n};\n\nexport function ContentStack({ id, title, quote, url, category }: Props) {\n\treturn (\n\t\t<Link href={new URL(url)} target="_blank">\n\t\t\t<Card className="hover:bg-secondary">\n\t\t\t\t<CardHeader>\n\t\t\t\t\t<div className="flex gap-4">\n\t\t\t\t\t\t<Badge>{id}</Badge>\n\t\t\t\t\t\t{category && <Badge variant="outline">{category}</Badge>}\n\t\t\t\t\t</div>\n\t\t\t\t</CardHeader>\n\t\t\t\t<CardContent>\n\t\t\t\t\t<CardTitle>{title}</CardTitle>\n\t\t\t\t\t<CardDescription className="truncate">\n\t\t\t\t\t\t{quote ? quote : "　"}\n\t\t\t\t\t</CardDescription>\n\t\t\t\t</CardContent>\n\t\t\t</Card>\n\t\t</Link>\n\t);\n}\n'],names:["Badge","Card","CardContent","CardDescription","CardHeader","CardTitle","Link","ContentStack","id","title","quote","url","category","href","URL","target","className","div","variant"],mappings:";AAAA,SAASA,KAAK,QAAQ,wBAAwB;AAC9C,SACCC,IAAI,EACJC,WAAW,EACXC,eAAe,EACfC,UAAU,EACVC,SAAS,QACH,uBAAuB;AAC9B,OAAOC,UAAU,YAAY;AAU7B,OAAO,SAASC,aAAa,EAAEC,EAAE,EAAEC,KAAK,EAAEC,KAAK,EAAEC,GAAG,EAAEC,QAAQ,EAAS;IACtE,qBACC,KAACN;QAAKO,MAAM,IAAIC,IAAIH;QAAMI,QAAO;kBAChC,cAAA,MAACd;YAAKe,WAAU;;8BACf,KAACZ;8BACA,cAAA,MAACa;wBAAID,WAAU;;0CACd,KAAChB;0CAAOQ;;4BACPI,0BAAY,KAACZ;gCAAMkB,SAAQ;0CAAWN;;;;;8BAGzC,MAACV;;sCACA,KAACG;sCAAWI;;sCACZ,KAACN;4BAAgBa,WAAU;sCACzBN,QAAQA,QAAQ;;;;;;;AAMvB"},_coverageSchema:"1a1c01bbd47fc00a2c39e90264f33305004495a9",hash:"bd5d2ddc7ddfc94d3c816ce511a51d537cb7876a"});var actualCoverage=coverage[path];return cov_16o5l6rpk2=function(){return actualCoverage},actualCoverage}function ContentStack({id,title,quote,url,category}){return cov_16o5l6rpk2().f[0]++,cov_16o5l6rpk2().s[0]++,(0,jsx_runtime.jsx)(link_default(),{href:new URL(url),target:"_blank",children:(0,jsx_runtime.jsxs)(card.Zp,{className:"hover:bg-secondary",children:[(0,jsx_runtime.jsx)(card.aR,{children:(0,jsx_runtime.jsxs)("div",{className:"flex gap-4",children:[(0,jsx_runtime.jsx)(badge.E,{children:id}),(cov_16o5l6rpk2().b[0][0]++,category&&(cov_16o5l6rpk2().b[0][1]++,(0,jsx_runtime.jsx)(badge.E,{variant:"outline",children:category})))]})}),(0,jsx_runtime.jsxs)(card.Wu,{children:[(0,jsx_runtime.jsx)(card.ZB,{children:title}),(0,jsx_runtime.jsx)(card.BT,{className:"truncate",children:quote?(cov_16o5l6rpk2().b[1][0]++,quote):(cov_16o5l6rpk2().b[1][1]++,"　")})]})]})})}cov_16o5l6rpk2(),cov_16o5l6rpk2().s[1]++,ContentStack.__docgenInfo={description:"",methods:[],displayName:"ContentStack",props:{id:{required:!0,tsType:{name:"number"},description:""},title:{required:!0,tsType:{name:"string"},description:""},quote:{required:!0,tsType:{name:"union",raw:"string | null",elements:[{name:"string"},{name:"null"}]},description:""},url:{required:!0,tsType:{name:"string"},description:""},category:{required:!1,tsType:{name:"string"},description:""}}};const content_stack_stories={title:"Components/Stack/ContentStack",component:ContentStack,tags:["autodocs"]},Default={args:{id:1,title:"サンプルタイトル",quote:"Sample quote",url:"https://example.com",category:"サンプルカテゴリー"}},__namedExportsOrder=["Default"];Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:'{\n  args: {\n    id: 1,\n    title: "サンプルタイトル",\n    quote: "Sample quote",\n    url: "https://example.com",\n    category: "サンプルカテゴリー"\n  }\n}',...Default.parameters?.docs?.source}}}}}]);