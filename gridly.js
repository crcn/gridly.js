(function($)
{  
	$.fn.gridly = function(ops)
	{

		//the context is the element gridly currently attached to.
		var ctx = this.context,
		self = this,
		ops = ops || {},

		//tells gridly to animate the grid on change / resize
		animate = ops.animate == undefined ? true : ops.animate,
		
		//tells gridly to update on gridly(). useful for false if we're just looking at some stats such as the grid width
		update  = ops.update  == undefined ? true : ops.update,

		//tells gridly to return the controller of the current element
		returnGdly = ops.getController;


		//if gdly is already defined then don't re-execute             
		if(!ctx.gdly)
		{
			var gdly = ctx.gdly = 
			{        
				easing:
				{
					type:'easeOutExpo'
					,duration:200
				}
				,update:function(animate)
				{                 
					      
					//FIRST we need to find the right positions with each cell         
					var cellsToPosition =  gdly.organize.bestFit(); 

					//next up, let's move 'em 
					gdly.positionCells(cellsToPosition,animate ? gdly.animateCell : gdly.moveCell);   
					
					
					//let's trigger an update so anything outside gridly knows when the grid's changed
					$(ctx).trigger('gridly.update');
				}


				//moves the cells to their rightful place         
				,positionCells:function(cellsToPosition,callback)
				{                                             
					for(var i = cellsToPosition.length; i--;)
					{
						var c = cellsToPosition[i],
						cell = c.cell;
						
						var offset = cell.offset();
						
						//let's not move the cell if it's not going anywhere...
						//this doesn't happen ever...
						/*if(offset.left == c.x && offset.top == c.y)
						{	console.log('not going anywhere...')
							continue;
						}*/
						
						cell.css({position:'absolute'});
						callback(c);

					}      
				}
				,animateCell:function(c)
				{           
					//stop all animations
					c.cell.stop();
					
					//animate the position of the grid
					c.cell.animate({left:c.x,top:c.y,opacity:1},gdly.easing.duration,gdly.easing.type)  
				}  
				,moveCell:function(c)
				{
					//useful for devices such as mobile/tablets where animations might not be
					//ideal for ALL cells.
					c.cell.css({left:c.x,top:c.y});
				}


				//calculates where each cell should go, and returns the coordinates
				,organize:
				{     
					keepOrder:function()
					{
						
					}  
					    
					//forces items to fit based on their content length
					,forceFit:function()
					{ 
						
					}
					
					
					//figured out 
					,bestFit:function()
					{                              

						//the child cells
						var children = ctx.childNodes,    

						//the width of the grid
						width = self.innerWidth(),  

						//padding between cells
						padding = ops.padding || 8,

						//start ONLY after the first row has started off!
						columnsFound = false, 

						numColumns = 0,


						//the x position of the current box
						x = 0,

						//make it easy, and faster by evaluating just an array. This also
						//allows us to use DIFFERENT ALGORITHMS for sorting boxes. Also used in edgar.
						cellsToPosition = [];


						//checks to see if the inner cell fits in the outer cell. this is a method for now
						//because it MIGHT change in the future when I debug with different sized cells.
						function fitsInCell(outer,inner)
						{    
							return inner.width <= outer.width;       
							// return inner.x >= outer.x && inner.toX <= outer.toX                                    
						} 

						var useableCells = [];  

						//skip any cells we can't use
						for(var i = 0, n = children.length; i < n; i++)
						{
							var child = children[i];
							
							//no comments, text elements, or nodes which are hidden.
							if((child.nodeType != 1 && child.nodeType != 3)) continue;
							// if() continue;
							
							child = $(child);
							
							if(child.css('display') == 'none') continue;
							useableCells.push(child);
						}
						

						for(var i = 0, n = useableCells.length; i < n; i++)
						{


							var cell = useableCells[i],
							cw = cell.width(),
							ch = cell.height();


							if(isNaN(cw)) cw = 0;
							if(isNaN(ch)) ch = 0;


							//okay, now that we've established the FIRST ROW, we can start
							//calculating where the other grid items go. We need to fit it like
							//a puzzle.
							if(x + cw > width)
							{    
								//reset the x position  
								columnsFound = true; 
							} 

							//the cell we're about to evaluate
							var icell = {
								x:x, 
								index:i,
								y:0, 
								width:cw,
								height:ch, 
								toX:x + cw, 
								toY:ch, 
								cell:cell
							}; 

							//NOTE: we push the cell BEFORE we run through the rest of the children because the for
							//loop never gets to this cell ;). Pushing the cell AFTER the following conditional statement
							//wouldn't work.

							cellsToPosition.push(icell)

							if(columnsFound)
							{                  

								var targetCell = null;

								//we want to loop through ALL of the children, starting with the LAST
								//item which should be the furthest down.    
								for(var j = i; j--;)
								{     
									//cell we're currently evaluating against
									var ocell = cellsToPosition[j];

									//skip any filled cells, but find the cell that's needn' some filln', which is of course the 
									//column with the SMALLEST height.     
									if(!ocell.filled && fitsInCell(ocell,icell) && (!targetCell || targetCell.toY > ocell.toY))
									{                              
										targetCell = ocell;                                              
									}
								}   

								//okie dokie. Now we have target column, we need to set the X position of that column       
								icell.x   		= targetCell.x;                                                      

								//set the y of the target column PLUS PADDING OF COURSE!!
								icell.y 	    = targetCell.toY + padding;   

								//now the current cell is open, for use, we need to set the toY so the NEXT cell using it can 
								//be pushed AFTER it.                 
								icell.toY = icell.y + icell.height;                       

								//once the target has a cell AFTER it, we need to make sure it's NEVER USED EVARRRR AGAIN
								targetCell.filled = true;               
							}       
							else
							{     
								//increment X + padding. THis chunk of code only gets executed until the columns are found 
								x += (icell.width || 0) + padding;  

								numColumns++;
							}
						}
                        
                        
 						
						gdly.numColumns = numColumns;
						gdly.width  = x;
           	
                        return cellsToPosition;
					} 
				} 
			};       
			
			function _lazyCallback(callback,duration)
			{
				var timeout;
				
				return function()
				{
					if(timeout) clearTimeout(timeout);
					timeout = setTimeout(callback,duration || 100);
				}
			}
			
			var resizeTimeout;
			               
			
			//tells ally gridly's to update. 
			$(window).bind('gridly.update', _lazyCallback(function()
			{              
				// gdly.easing.duration = 2000;             
				gdly.update(true);          
				// gdly.easing.duration = 200;
			},25))
			
			$(window).resize(_lazyCallback(function()
			{                                    
				gdly.update(animate);
			}));
			
			
		}                               
		
		if(update) ctx.gdly.update(animate);   
		
		return returnGdly ? ctx.gdly : this;
	}
	
	
})(jQuery);






                                                  